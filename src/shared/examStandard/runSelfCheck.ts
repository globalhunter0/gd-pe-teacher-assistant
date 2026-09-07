import { runExamBatchSelfCheckOrThrow } from '../examBatch/selfcheck'
import { runTrainingTeamSelfCheckOrThrow } from '../trainingTeam/selfcheck'
import { listBuiltinExamStandards } from './catalog'
import { runExamTableIntegritySelfCheckOrThrow } from './integrity'
import { runExamScoreEngineSelfCheckOrThrow } from './selfcheck'

console.log(runExamScoreEngineSelfCheckOrThrow())
console.log(runExamTableIntegritySelfCheckOrThrow(listBuiltinExamStandards()))
console.log(runExamBatchSelfCheckOrThrow())
console.log(runTrainingTeamSelfCheckOrThrow())
