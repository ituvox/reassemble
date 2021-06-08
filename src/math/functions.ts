import { Attribute, JobInfo } from 'data/jobs'
import { JOB_MODS } from './modifiers/job'
import { Level, LEVEL_MODS } from './modifiers/level'

/**
 * All functions are sourced from Allagan Studies:
 * https://www.akhmorning.com/allagan-studies/how-to-be-a-math-wizard/shadowbringers/functions/
 */

export function fWD(wd: number, level: Level, jobMod_att: number)
{
    const lvlMod_main = LEVEL_MODS[level].MAIN

    return Math.floor( (lvlMod_main * jobMod_att / 1000) + wd )
}

// Works for 80 and non-tank only! TODO
export function fAP(ap: number) {
    return Math.floor(165 * (ap - 340) / 340) + 100
}

export function fDET(det: number, level: Level) {
    const lvlMod_main = LEVEL_MODS[level].MAIN
    const lvlMod_div = LEVEL_MODS[level].DIV

    return Math.floor( 130 * ((det - lvlMod_main) / lvlMod_div) + 1000 )
}

// export function fTNC(/* ... */) TODO

export function fSPD(spd: number, level: Level) {
    const lvlMod_sub = LEVEL_MODS[level].SUB
    const lvlMod_div = LEVEL_MODS[level].DIV

    return Math.floor( 130 * ((spd - lvlMod_sub) / lvlMod_div) + 1000 )
}

export function fCRIT(crit: number, level: Level) {
    const lvlMod_sub = LEVEL_MODS[level].SUB
    const lvlMod_div = LEVEL_MODS[level].DIV

    return Math.floor( 200 * ((crit - lvlMod_sub) / lvlMod_div) + 1400 )
}

export function critRate(crit: number, level: Level) {
    const lvlMod_sub = LEVEL_MODS[level].SUB
    const lvlMod_div = LEVEL_MODS[level].DIV

    return Math.floor( ((200 * (crit - lvlMod_sub)) / lvlMod_div) + 50 ) / 10
}

export function dhRate(dh: number, level: Level) {
    const lvlMod_sub = LEVEL_MODS[level].SUB
    const lvlMod_div = LEVEL_MODS[level].DIV

    return Math.floor( (550 * (dh - lvlMod_sub)) / lvlMod_div ) / 10
}

export function fAUTO(wd: number, delay: number, level: Level, jobMod_att: number) {
    const lvlMod_main = LEVEL_MODS[level].MAIN

    return Math.floor( Math.floor((lvlMod_main * jobMod_att / 1000) + wd) * (delay / 3) )
}
