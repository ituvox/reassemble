import { FFLogsEvent } from 'api/fflogs/event'
import { Friend } from 'api/fflogs/fight'
import { FFLogsParser } from 'api/fflogs/parser'
import { JOBS } from 'data/jobs'
import { expectedDamage } from 'functions/damage'
import { DamageInstance } from 'simulator/damage'
import { Enemy, Player } from 'simulator/entity'
import { Stats } from 'simulator/gear/stats'
import { RAID_DEBUFFS } from 'simulator/raidbuffs'
import { formatSeconds } from 'utilities/format'
import { CastHandler, DamageHandler } from './handlers'

// ToDo: ENEMY DEBUFFS ARE BEING IGNORED. CAREFUL.
export class Simulator {
    public player: Player

    private parser: FFLogsParser
    private damageInstances: DamageInstance[] = []
    private enemies: Map<string, Enemy> = new Map()

    constructor(parser: FFLogsParser, player: Friend) {
        this.parser = parser

        const playerCtor = JOBS[player.type].playerCtor
        this.player = new playerCtor(player.id, this.handleCastInstance, this.handleDamageInstance)
    }

    /**
     * Callback to notify the simulator of a new cast by the player
     */
    private handleCastInstance: CastHandler = (cast) => {
        const enemy = this.enemies.get(cast.targetKey)
        if (enemy) {
            // cast.buffs.push(...enemy.activeDebuffs)
        }
    }

    /**
     * Callback to notify the simulator of a new damage instance
     */
    private handleDamageInstance: DamageHandler = (damage) => {
        this.damageInstances.push(damage)
    }

    private async processEvent(event: FFLogsEvent): Promise<void> {
        if (this.enemies.has(event.targetKey)) {
            this.enemies.get(event.targetKey).processEvent(event)

        } else if (!this.parser.fight.friends.some(friend => friend.id === event.targetID)) {
            const newEnemy = new Enemy(event.targetKey, this.player.debuffs ?? [])
            this.enemies.set(event.targetKey, newEnemy)
            newEnemy.processEvent(event)
        }

        this.player.processEvent(event)
    }

    private async extractDamage(): Promise<void> {
        const debuffIDs = RAID_DEBUFFS
            .map(debuff => debuff.statusID)

        const events = this.parser.getEvents(this.player.id, debuffIDs)

        for await (const event of events) {
            this.processEvent(event)
        }
    }

    /**
     * Computes expected damage for each damage event using the given Stats
     */
    public async calculateDamage(stats: Stats) {
        // Cache damage instances from the report
        if (this.damageInstances.length === 0) {
            await this.extractDamage()
        }

        let totalDamage = 0
        let lastDamageTime = 0
        let totalPotency = 0 // ignores buffs and potion
        const damageArray: Array<{ x: number, y: number }> = []
        
        this.damageInstances.forEach(instance => {
            // Adjust potency if the job logic specifies it
            if (instance.options.postAdjustment) {
                instance.potency = instance.options.postAdjustment()
            }

            var timeSoFar = (instance.timestamp - this.parser.fight.start) / 1000

            /*const offsetTime = 14*60+39
            if (timeSoFar < offsetTime) return
            timeSoFar -= offsetTime*/
            
            // TODO level stuff (90 assumed for now)
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            const damage = expectedDamage(instance, this.player.jobInfo, 90, stats)
            totalDamage += damage

            // TODO: Stdv stuff would go here
            if (instance.type != 'DoT'){
                console.log('Hit with potency:', instance.potency, 'Damage:', damage, ' (ratio ', damage/instance.potency, ') Time so far:', formatSeconds(timeSoFar))
                //console.log(instance)
                //console.log('Damage:', damage, 'Time so far:', formatSeconds(timeSoFar))
                totalPotency += instance.potency
            }

            // Add a new data point to the graph at most every 2 seconds
            if (timeSoFar > lastDamageTime + 2) {
                const dpsSoFar = totalDamage / timeSoFar
                damageArray.push({ x: timeSoFar, y: dpsSoFar })
                lastDamageTime = timeSoFar
            }
        })

        console.log('Total potency (no pot, no eno, no DoT): ', totalPotency)

        const duration = (this.parser.fight.end - this.parser.fight.start) / 1000
        const expected = totalDamage / duration

        return {
            data: damageArray,
            expected: expected,
            total: totalDamage,
        }
    }
}
