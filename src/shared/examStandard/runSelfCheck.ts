import { runAppApiSelfCheckOrThrow } from '../appApi/selfcheck'
import { runAppUpdateSelfCheckOrThrow } from '../appUpdate/selfcheck'
import { runWindowNavigationSelfCheckOrThrow } from '../security/selfcheck'
import { runAppVersionSelfCheckOrThrow } from '../appVersionSelfcheck'
import { runBackupRestoreSelfCheckOrThrow } from '../backup/selfcheck'
import { runUserPreferencesSelfCheckOrThrow } from '../userPreferences/selfcheck'
import { runCurriculumCatalogSelfCheckOrThrow } from '../curriculum/selfcheck'
import { runTeachingDesignSelfCheckOrThrow } from '../teachingDesign/selfcheck'
import { runExamBatchSelfCheckOrThrow } from '../examBatch/selfcheck'
import { runV0160ExcelBatchSelfCheckOrThrow } from '../examBatch/v0160Selfcheck'
import { runV0170PeTestImportPlanSelfCheckOrThrow } from '../examBatch/v0170ImportPlanSelfcheck'
import { runScheduleBulkDeleteSelfCheckOrThrow } from '../schedule/bulkDeleteSelfcheck'
import { runScheduleImportSelfCheckOrThrow } from '../schedule/importSelfcheck'
import { runScheduleLinkageSelfCheckOrThrow } from '../schedule/selfcheck'
import { runPeSessionWorkbenchSelfCheckOrThrow } from '../peSession/selfcheck'
import { runTrainingTeamSelfCheckOrThrow } from '../trainingTeam/selfcheck'
import { runRosterAutoDetectionSelfCheckOrThrow } from '../student/detectSelfcheck'
import { runStudentImportIpcSelfCheckOrThrow } from '../student/ipcSelfcheck'
import { runRosterReconciliationSelfCheckOrThrow } from '../student/selfcheck'
import { runV0131RegressionSelfCheckOrThrow } from '../student/v0131Selfcheck'
import { runCityScoringStandardsSelfCheckOrThrow } from './cityScoringSelfcheck'
import { runFoshanScoringSelfCheckOrThrow } from './foshanSelfcheck'
import { runZhuhaiScoringSelfCheckOrThrow } from './zhuhaiSelfcheck'
import { runShantouScoringSelfCheckOrThrow } from './shantouSelfcheck'
import { runShaoguanScoringSelfCheckOrThrow } from './shaoguanSelfcheck'
import { runHeyuanScoringSelfCheckOrThrow } from './heyuanSelfcheck'
import { runMeizhouScoringSelfCheckOrThrow } from './meizhouSelfcheck'
import { runHuizhouScoringSelfCheckOrThrow } from './huizhouSelfcheck'
import { runShanweiScoringSelfCheckOrThrow } from './shanweiSelfcheck'
import { runZhongshanScoringSelfCheckOrThrow } from './zhongshanSelfcheck'
import { runYangjiangScoringSelfCheckOrThrow } from './yangjiangSelfcheck'
import { runMaomingScoringSelfCheckOrThrow } from './maomingSelfcheck'
import { runZhaoqingScoringSelfCheckOrThrow } from './zhaoqingSelfcheck'
import { runQingyuanScoringSelfCheckOrThrow } from './qingyuanSelfcheck'
import { runChaozhouScoringSelfCheckOrThrow } from './chaozhouSelfcheck'
import { runJieyangScoringSelfCheckOrThrow } from './jieyangSelfcheck'
import { runYunfuScoringSelfCheckOrThrow } from './yunfuSelfcheck'
import { listBuiltinExamStandards } from './catalog'
import { runExamTableIntegritySelfCheckOrThrow } from './integrity'
import { runExamScoreEngineSelfCheckOrThrow } from './selfcheck'
import { runV0150AcceptanceSelfCheckOrThrow } from './v0150AcceptanceSelfcheck'
import { runV0180AnalyticsSelfCheckOrThrow } from '../statistics/v0180Selfcheck'
import { runHistoryCompareSelfCheckOrThrow } from '../statistics/historyCompareSelfcheck'
import { runStatsTestPanelActualItemSelfCheckOrThrow } from '../statistics/statsTestPanelSelfcheck'
import { runV0190PeTestImportEntrySelfCheckOrThrow } from '../examBatch/v0190Selfcheck'
import { runV0200PeTestCenterSelfCheckOrThrow } from '../peTest/v0200Selfcheck'
import { runV0210PeTestQuickEntrySelfCheckOrThrow } from '../peTest/v0210Selfcheck'
import { runV0220PeTestFieldEntrySelfCheckOrThrow } from '../peTest/v0220Selfcheck'
import { runV0230PeTestResultClosureSelfCheckOrThrow } from '../peTest/v0230Selfcheck'
import { runNationalFitnessPhaseASelfCheckOrThrow } from '../nationalFitness/phaseASelfcheck'
import { runNationalFitnessPhaseBSelfCheckOrThrow } from '../nationalFitness/phaseBSelfcheck'
import { runNationalFitnessPhaseBPlusSelfCheckOrThrow } from '../nationalFitness/phaseBPlusSelfcheck'
import { runNationalFitnessPhaseC1SelfCheckOrThrow } from '../nationalFitness/phaseC1Selfcheck'
import { runNationalFitnessPhaseC2SelfCheckOrThrow } from '../nationalFitness/phaseC2Selfcheck'
import { runNationalFitnessPhaseC3SelfCheckOrThrow } from '../nationalFitness/phaseC3Selfcheck'
import { runNationalFitnessPhaseD1SelfCheckOrThrow } from '../peTest/phaseD1Selfcheck'
import { runPeTestBusinessClosureSelfCheckOrThrow } from '../peTest/closureSelfcheck'
import { runV0260PeTestLifecycleSelfCheckOrThrow } from '../peTest/v0260Selfcheck'
import { runV0260P02MakeupExportSelfCheckOrThrow } from '../peTest/v0260P02Selfcheck'
import { runV0260P03StudentHistorySelfCheckOrThrow } from '../peTest/v0260P03Selfcheck'
import { runV0270P01ClassroomQuizSelfCheckOrThrow } from '../peTest/v0270P01Selfcheck'
import { runV0270P02ParticipationSelfCheckOrThrow } from '../peSession/v0270P02Selfcheck'
import { runV0270P03SessionStatusSelfCheckOrThrow } from '../peSession/v0270P03Selfcheck'
import { runV0280P01WeeklyTaskSelfCheckOrThrow } from '../teachingPlan/v0280P01Selfcheck'
import { runV0280P02PlanLinkSelfCheckOrThrow } from '../teachingPlan/v0280P02Selfcheck'
import { runV0280P03ExecutionSelfCheckOrThrow } from '../teachingPlan/v0280P03Selfcheck'
import { runV0290P01IntegritySelfCheckOrThrow } from '../dataIntegrity/v0290P01Selfcheck'
import { runV0290P02ImportTransactionSelfCheckOrThrow } from '../importTransaction/v0290P02Selfcheck'
import { runV0290P03StartupRecoverySelfCheckOrThrow } from '../dataIntegrity/v0290P03Selfcheck'

async function main(): Promise<void> {
  console.log(runAppVersionSelfCheckOrThrow())
  console.log(runExamScoreEngineSelfCheckOrThrow())
  console.log(runExamTableIntegritySelfCheckOrThrow(listBuiltinExamStandards()))
  console.log(runCityScoringStandardsSelfCheckOrThrow())
  console.log(runFoshanScoringSelfCheckOrThrow())
  console.log(runZhuhaiScoringSelfCheckOrThrow())
  console.log(runShantouScoringSelfCheckOrThrow())
  console.log(runShaoguanScoringSelfCheckOrThrow())
  console.log(runHeyuanScoringSelfCheckOrThrow())
  console.log(runMeizhouScoringSelfCheckOrThrow())
  console.log(runHuizhouScoringSelfCheckOrThrow())
  console.log(runShanweiScoringSelfCheckOrThrow())
  console.log(runZhongshanScoringSelfCheckOrThrow())
  console.log(runYangjiangScoringSelfCheckOrThrow())
  console.log(runMaomingScoringSelfCheckOrThrow())
  console.log(runZhaoqingScoringSelfCheckOrThrow())
  console.log(runQingyuanScoringSelfCheckOrThrow())
  console.log(runChaozhouScoringSelfCheckOrThrow())
  console.log(runJieyangScoringSelfCheckOrThrow())
  console.log(runYunfuScoringSelfCheckOrThrow())
  console.log(runV0150AcceptanceSelfCheckOrThrow())
  console.log(runExamBatchSelfCheckOrThrow())
  console.log(runV0160ExcelBatchSelfCheckOrThrow())
  console.log(await runV0170PeTestImportPlanSelfCheckOrThrow())
  console.log(runV0180AnalyticsSelfCheckOrThrow())
  console.log(runHistoryCompareSelfCheckOrThrow())
  console.log(runStatsTestPanelActualItemSelfCheckOrThrow())
  console.log(await runV0190PeTestImportEntrySelfCheckOrThrow())
  console.log(await runV0200PeTestCenterSelfCheckOrThrow())
  console.log(runV0210PeTestQuickEntrySelfCheckOrThrow())
  console.log(runV0220PeTestFieldEntrySelfCheckOrThrow())
  console.log(await runV0230PeTestResultClosureSelfCheckOrThrow())
  console.log(runNationalFitnessPhaseASelfCheckOrThrow())
  console.log(runNationalFitnessPhaseBSelfCheckOrThrow())
  console.log(runNationalFitnessPhaseBPlusSelfCheckOrThrow())
  console.log(runNationalFitnessPhaseC1SelfCheckOrThrow())
  console.log(runNationalFitnessPhaseC2SelfCheckOrThrow())
  console.log(runNationalFitnessPhaseC3SelfCheckOrThrow())
  console.log(runNationalFitnessPhaseD1SelfCheckOrThrow())
  console.log(runPeTestBusinessClosureSelfCheckOrThrow())
  console.log(await runV0260PeTestLifecycleSelfCheckOrThrow())
  console.log(runV0260P02MakeupExportSelfCheckOrThrow())
  console.log(runV0260P03StudentHistorySelfCheckOrThrow())
  console.log(await runV0270P01ClassroomQuizSelfCheckOrThrow())
  console.log(await runV0270P02ParticipationSelfCheckOrThrow())
  console.log(await runV0270P03SessionStatusSelfCheckOrThrow())
  console.log(runV0280P01WeeklyTaskSelfCheckOrThrow())
  console.log(await runV0280P02PlanLinkSelfCheckOrThrow())
  console.log(runV0280P03ExecutionSelfCheckOrThrow())
  console.log(runV0290P01IntegritySelfCheckOrThrow())
  console.log(await runV0290P02ImportTransactionSelfCheckOrThrow())
  console.log(await runV0290P03StartupRecoverySelfCheckOrThrow())
  console.log(runPeSessionWorkbenchSelfCheckOrThrow())
  console.log(runTrainingTeamSelfCheckOrThrow())
  console.log(await runScheduleLinkageSelfCheckOrThrow())
  console.log(await runScheduleBulkDeleteSelfCheckOrThrow())
  console.log(await runScheduleImportSelfCheckOrThrow())
  console.log(await runBackupRestoreSelfCheckOrThrow())
  console.log(await runRosterReconciliationSelfCheckOrThrow())
  console.log(runRosterAutoDetectionSelfCheckOrThrow())
  console.log(runWindowNavigationSelfCheckOrThrow())
  console.log(runAppApiSelfCheckOrThrow())
  console.log(runAppUpdateSelfCheckOrThrow())
  console.log(runStudentImportIpcSelfCheckOrThrow())
  console.log(runV0131RegressionSelfCheckOrThrow())
  console.log(await runUserPreferencesSelfCheckOrThrow())
  console.log(runCurriculumCatalogSelfCheckOrThrow())
  console.log(await runTeachingDesignSelfCheckOrThrow())
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
