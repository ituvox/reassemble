import { Attribute } from 'functions/modifiers/job'
import { Dancer } from 'simulator/entity/player/jobs/dancer'
import { JobInfo } from './job'

export const DNC_INFO: JobInfo = {
    job: 'Dancer',
    role: 'Ranged',
    playerCtor: Dancer,
    mainStat: Attribute.DEX,
    stats: [
        'weaponDamage',
        'vitality',
        'dexterity',
        'critical',
        'determination',
        'direct',
        'skillspeed',
    ],
    weaponDelay: 3.12,
    trait: 120,
    iconPath: '/jobicons/dnc.svg',
    latest: {major: 6, minor: 2},
    bis: 'c0f9c2b1-fb81-4a07-ba2f-a3a18c20a7a2',
    damageMap: {
        Ability: Attribute.DEX,
        Auto: Attribute.DEX,
        Weaponskill: Attribute.DEX,
    },
}
