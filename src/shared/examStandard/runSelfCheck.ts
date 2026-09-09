import { runBackupRestoreSelfCheckOrThrow } from '../backup/selfcheck'
import { runExamBatchSelfCheckOrThrow } from '../examBatch/selfcheck'
import { runScheduleBulkDeleteSelfCheckOrThrow } from '../schedule/bulkDeleteSelfcheck'
import { runScheduleImportSelfCheckOrThrow } from '../schedule/importSelfcheck'
import { runScheduleLinkageSelfCheckOrThrow } from '../schedule/selfcheck'
import { runTrainingTeamSelfCheckOrThrow } from '../trainingTeam/selfcheck'
import { runRosterAutoDetectionSelfCheckOrThrow } from '../student/detectSelfcheck'
import { runStudentImportIpcSelfCheckOrThrow } from '../student/ipcSelfcheck'
import { runRosterReconciliationSelfCheckOrThrow } from '../student/selfcheck'
import { runV0131RegressionSelfCheckOrThrow } from '../student/v0131Selfcheck'
import { listBuiltinExamStandards } from './catalog'
import { runExamTableIntegritySelfCheckOrThrow } from './integrity'
import { runExamScoreEngineSelfCheckOrThrow } from './selfcheck'

async function main(): Promise<void> {
  console.log(runExamScoreEngineSelfCheckOrThrow())
  console.log(runExamTableIntegritySelfCheckOrThrow(listBuiltinExamStandards()))
  console.log(runExamBatchSelfCheckOrThrow())
  console.log(runTrainingTeamSelfCheckOrThrow())
  console.log(await runScheduleLinkageSelfCheckOrThrow())
  console.log(await runScheduleBulkDeleteSelfCheckOrThrow())
  console.log(await runScheduleImportSelfCheckOrThrow())
  console.log(await runBackupRestoreSelfCheckOrThrow())
  console.log(await runRosterReconciliationSelfCheckOrThrow())
  console.log(runRosterAutoDetectionSelfCheckOrThrow())
  console.log(runStudentImportIpcSelfCheckOrThrow())
  console.log(runV0131RegressionSelfCheckOrThrow())
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
