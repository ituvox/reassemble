import { DamageEvent } from 'api/fflogs/event'
import { BLM_INFO } from 'data/jobs/BLM'
import { BLM, RAIDBUFFS } from 'data/packs'
import { Buff } from 'simulator/buff'
import { DamageOptions } from 'simulator/damage'
import { Potency } from 'simulator/modules/potency'
import { Player } from '../player'
import { CastEvent } from 'api/fflogs/event'
import { formatSeconds } from 'utilities/format'
import { STATUSES } from 'data/packs/ALL'

const ONLY_RDPS = true
const WEIGHT_PROCS = true
// TODO: Implement F3p weighting. Maybe adjust time for mock-cast depending on action.
// ToDo: ENEMY DEBUFFS ARE BEING IGNORED IN simulator.ts, SO SETTING ONLY_RDPS = false DOES NOT ACTUALLY WORK. 
// Assuming prepull sharp on first T3

// No status for this, need to fake it
const ENOCHIAN_DURATION_MS = 15000
const ENO: Buff = {
    statusID: BLM.STATUSES.ENOCHIAN.id,
    potency: 1.21,
}
const AUTO_ID = 7
const MEDICATED_ID = 1000049
const FIRE_III_DAMAGE_DELAY = 1292

const TC_DURATION_MS = 40000
const F3P_DURATION_MS = 30000

export class BlackMage extends Player {
    jobInfo = BLM_INFO
    potency: Potency

    private astralUmbral: number = 0 // from -3 for ice to 3 for fire
    private lastEnochian: number = 0

    // Keeping track of which procs came from sharpcast to weight proc damage
    private sharpF = false
    private sharpF_time = 0
    private sharpT = false
    private sharpT_time = 0
    private T3_casted = false
    private last_T3_time = 0 // weight a non-sharped t3 usage according to t3 ticks that could have generated it

    private first_cast_time = -1 // debugging reasons

    protected init() {
        super.init()

        this.potency = new Potency(this.casts)
        this.addDependency(this.potency)

        Object.values(BLM.ACTIONS).forEach(action => {
            this.addHandler('cast', action.id, this.onCast)
            this.addHandler('damage', action.id, this.onDamage)
        })

        Object.values(BLM.DEBUFFS).forEach(debuff => {
            this.addHandler('tick', debuff.id, this.onTick)
        })
    }

    protected onDamage(event: DamageEvent) {
        const options: DamageOptions = {}
        const key = this.getCastKey(event)

        if (!this.casts.has(key)) {
            console.warn('Damage event found without a matching cast. Creating a mock cast assuming Fire III damage application delay.')
            console.warn(key)
            console.warn(event)
            
            const mockCast: CastEvent = {
                type: 'cast',
                actionID: event.actionID,
                timestamp: event.timestamp - FIRE_III_DAMAGE_DELAY,
                sourceID: event.sourceID,
                targetID: event.targetID,
                targetKey: event.targetKey    
            }
            this.onCast(mockCast)
        }

        const cast = this.casts.get(key)
        const action = this.data.findAction(event.actionID)

        // Check if this hit has falloff
        let falloff = 0
        if (action.falloff && !cast.firstHit) {
            falloff = action.falloff
        }

        // Subsequent hits will have falloff
        cast.firstHit = false

        this.damageCallback({
            type: action.type,
            timestamp: event.timestamp,
            potency: cast.potency,
            buffs: this.casts.get(key).buffs,
            falloff: falloff,
            options: {...cast.options, ...options},
        })
        // All functionality from super.onDamage is copied here, do not uncomment
        // super.onDamage(event, options)
    }

    private aspect(actionID: number) {
        switch (actionID){
            case BLM.ACTIONS.BLIZZARD.id:
            case BLM.ACTIONS.BLIZZARD_III.id:
            case BLM.ACTIONS.BLIZZARD_IV.id:
                return -1
            case BLM.ACTIONS.FIRE.id:
            case BLM.ACTIONS.FIRE_III.id:
            case BLM.ACTIONS.FIRE_IV.id:
            case BLM.ACTIONS.DESPAIR.id:
                return 1
            default:
                return 0
        }
    }

    protected onCast (event: CastEvent) {
        if (this.first_cast_time == -1) this.first_cast_time = event.timestamp

        //const buffs = Array.from(this.activeBuffs)
        const buffs : Buff[] = []
        this.activeBuffs.forEach(buff => {
            if (!ONLY_RDPS || buff.statusID == MEDICATED_ID ) {
                buffs.push(buff)
            }
        })
        const options: DamageOptions = {}

        // bruteforce handling of autos
        if (event.actionID == AUTO_ID) options.addedPotency = this.data.findAction(event.actionID).potency*(0.005 - 1)

        // update enochian state before the cast
        if (event.timestamp > this.lastEnochian + ENOCHIAN_DURATION_MS) this.astralUmbral = 0

        // thunder and proc logic
        if (event.actionID == BLM.ACTIONS.THUNDER_III.id){
            console.log('Thunder at ', formatSeconds((event.timestamp - this.first_cast_time) / 1000), 'Sharp up:', this.hasStatus(BLM.STATUSES.SHARPCAST.id)||!this.T3_casted)
            var tc_weight : number
            if (!WEIGHT_PROCS) {
                if (this.hasStatus(BLM.STATUSES.THUNDERCLOUD.id)) tc_weight = 1
                else tc_weight = 0
            }
            else {
                console.log('Timestamp ', event.timestamp, ', sharpT ', this.sharpT, ', sharpT_time ', this.sharpT_time)
                if (this.sharpT && event.timestamp - this.sharpT_time  < TC_DURATION_MS) {
                    console.log('tc from sharp consumed')
                    tc_weight = 1
                }
                else if (!this.T3_casted) {
                    console.log('first t3 casted')
                    tc_weight = 0
                }
                else {
                    // how long last T3 ticked making a usable t3p
                    const tick_time = Math.min(this.last_T3_time + 30000, event.timestamp) - Math.max(this.last_T3_time, event.timestamp - TC_DURATION_MS) 
                    const num_ticks = Math.round((tick_time - 1500)/3000)
                    tc_weight = 1 - Math.pow(0.9, num_ticks)
                    console.log(tc_weight, ' tc from no sharp and ', num_ticks, ' ticks.')
                    //console.log(event)
                    //console.log(this.data.findAction(event.actionID))
                }
            }
            options.addedPotency = tc_weight*350
            this.sharpT = false
            if (!this.T3_casted || this.hasStatus(BLM.STATUSES.SHARPCAST.id)) { // assume prepull sharp on first T3...
                this.sharpT = true
                this.sharpT_time = event.timestamp
            }
            this.T3_casted = true
            this.last_T3_time = event.timestamp 
        }
        

        // apply enochian modifiers
        if (this.astralUmbral != 0) {
            buffs.push(ENO) // 1.21 multiplier handled by the Buff processor so it applies to thunder III DoTs
            var multiplier = 1 
            const castAspect = this.aspect(event.actionID)
            if (castAspect != 0){
                if (this.astralUmbral > 0){
                    if (castAspect == 1) multiplier *= (1.2 + 0.2*this.astralUmbral)
                    if (castAspect == -1) multiplier *= (1 - 0.1*this.astralUmbral)
                }
                if (this.astralUmbral < 0){
                    if (castAspect == 1) multiplier *= (1 + 0.1*this.astralUmbral)
                }
                //console.log(this.data.findAction(event.actionID))
                //console.log('Time: ', formatSeconds(event.timestamp/1000), ', AstralUmbral: ', this.astralUmbral, ', Spell aspect:', castAspect, ', Multiplier:', multiplier)
                options.addedPotency = this.data.findAction(event.actionID).potency*(multiplier - 1)
            }
        }
                
        // debug single spell logic
        //if (event.actionID != BLM.ACTIONS.THUNDER_III.id) options.addedPotency = this.data.findAction(event.actionID).potency*(-1);
        //options.addedPotency = this.data.findAction(event.actionID).potency*(-1) // removes everything but dots!
        
        // update enochian state after the cast 
        switch (event.actionID){
            case BLM.ACTIONS.BLIZZARD_III.id :
                this.lastEnochian = event.timestamp
                this.astralUmbral = -3
                break;
            case BLM.ACTIONS.FIRE_III.id :
            case BLM.ACTIONS.DESPAIR.id :
                this.lastEnochian = event.timestamp
                this.astralUmbral = 3
                break;
            case BLM.ACTIONS.FIRE.id :
                if (this.astralUmbral >= 0){
                    this.lastEnochian = event.timestamp
                    this.astralUmbral = Math.min(3, this.astralUmbral+1)
                }
                else this.astralUmbral = 0;
                break;
            case BLM.ACTIONS.PARADOX.id :
                if (this.astralUmbral >= 0){
                    this.lastEnochian = event.timestamp
                    this.astralUmbral = Math.min(3, this.astralUmbral+1)
                }
                break;
            case BLM.ACTIONS.BLIZZARD.id :                
                if (this.astralUmbral <= 0){
                    this.lastEnochian = event.timestamp
                    this.astralUmbral = Math.max(-3, this.astralUmbral-1)
                }
                else this.astralUmbral = 0
                break;
            case BLM.ACTIONS.TRANSPOSE.id:
                if (this.astralUmbral != 0) {
                    this.astralUmbral = -this.astralUmbral / Math.abs(this.astralUmbral)
                    this.lastEnochian = event.timestamp
                }
                break;
            case BLM.ACTIONS.UMBRAL_SOUL.id:
                this.lastEnochian = event.timestamp
                this.astralUmbral = Math.max(-3, this.astralUmbral-1)
                break;
        }
        this.addCast(event, buffs, options)
    }
}