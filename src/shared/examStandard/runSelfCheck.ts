import { runBackupRestoreSelfCheckOrThrow } from '../backup/selfcheck'
import { runExamBatchSelfCheckOrThrow } from '../examBatch/selfcheck'
import { runScheduleLinkageSelfCheckOrThrow } from '../schedule/selfcheck'
import { runTrainingTeamSelfCheckOrThrow } from '../trainingTeam/selfcheck'
import { listBuiltinExamStandards } from './catalog'
import { runExamTableIntegritySelfCheckOrThrow } from './integrity'
import { runExamScoreEngineSelfCheckOrThrow } from './selfcheck'

async function main(): Promise<void> {
  console.log(runExamScoreEngineSelfCheckOrThrow())
  console.log(runExamTableIntegritySelfCheckOrThrow(listBuiltinExamStandards()))
  console.log(runExamBatchSelfCheckOrThrow())
  console.log(runTrainingTeamSelfCheckOrThrow())
  console.log(await runScheduleLinkageSelfCheckOrThrow())
  console.log(await runBackupRestoreSelfCheckOrThrow())
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
