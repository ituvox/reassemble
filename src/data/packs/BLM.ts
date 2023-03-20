import {preserve} from 'utilities/types'
import {Action, Debuff, Status} from '../types'

export const ACTIONS = preserve<Action>()({
    BLIZZARD: {
        id: 142,
        type: 'Spell',
        potency: 180,
    },
    BLIZZARD_III: {
        id: 154,
        type: 'Spell',
        potency: 260,
    },
    BLIZZARD_IV: {
        id: 3576,
        type: 'Spell',
        potency: 310,
    },
    DESPAIR: {
        id: 16505,
        type: 'Spell',
        potency: 340,
    },
    FIRE: {
        id: 141,
        type: 'Spell',
        potency: 180,
    },
    FIRE_III: {
        id: 152,
        type: 'Spell',
        potency: 260,
    },
    FIRE_IV: {
        id: 3577,
        type: 'Spell',
        potency: 310,
    },
    FOUL: {
        id: 7422,
        type: 'Spell',
        potency: 600,
        multihit: true,
        falloff: 0.6,
    },
    PARADOX: {
        id: 25797,
        type: 'Spell',
        potency: 500,
    },
    THUNDER_III: {
        id: 153,
        type: 'Spell',
        potency: 50,
    },
    XENOGLOSSY: {
        id: 16507,
        type: 'Spell',
        potency: 800,
    },
    TRANSPOSE : {
        id : 149,
        type : 'Ability'
    },
    UMBRAL_SOUL : {
        id : 16506,
        type : 'Ability',
        potency : 0
    }
})

export const STATUSES = preserve<Status>()({
    THUNDERCLOUD: {
        id: 164,
    },
    ENOCHIAN : {
        id: 999999,
    },
    FIRESTARTER: {
        id: 165,
    },
    SHARPCAST : {
        id: 867,
    }
})


export const DEBUFFS = preserve<Debuff>()({
    THUNDER_III: {
        id: 163,
        potency: 35,
        castActions: [
            ACTIONS.THUNDER_III.id,
        ],
    },
})
