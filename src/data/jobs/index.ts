import { BRD_INFO } from './BRD'
import { DNC_INFO } from './DNC'
import { Job, JobInfo } from './job'
import { MCH_INFO } from './MCH'
import { NIN_INFO } from './NIN'
import { RPR_INFO } from './RPR'
import { BLM_INFO } from './BLM'

export { Job, JobInfo }

export const JOBS: Record<Job, JobInfo> = {
    Bard: BRD_INFO,
    Dancer: DNC_INFO,
    Machinist: MCH_INFO,
    Ninja: NIN_INFO,
    Reaper: RPR_INFO,
    BlackMage: BLM_INFO,
}
