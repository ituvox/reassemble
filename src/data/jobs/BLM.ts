import { Attribute } from 'functions/modifiers/job'
import { BlackMage } from 'simulator/entity/player/jobs/blackmage'
import { JobInfo } from './job'

export const BLM_INFO: JobInfo = {
    job: 'BlackMage',
    role: 'Caster',
    playerCtor: BlackMage,
    mainStat: Attribute.INT,
    stats: [
        'weaponDamage',
        'vitality',
        'intelligence',
        'critical',
        'determination',
        'direct',
        'spellspeed',
    ],
    weaponDelay: 3,
    trait: 130,
    iconPath: '/jobicons/blm.svg',
    latest: {major: 6, minor: 3},
    bis: '7669c4cb-ca13-479a-97ef-7f3e2a69a039',
    damageMap: {
        Ability: Attribute.INT,
        Auto: Attribute.STR, // TODO: BLM Autos are crazy
        DoT: Attribute.INT,
        Spell: Attribute.INT,
        Weaponskill: Attribute.INT,
    },
}
