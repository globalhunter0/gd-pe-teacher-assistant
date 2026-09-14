import type { NationalFitnessScoreTable } from './types'

/** K-12 基础单项评分表。数字转录自《国家学生体质健康标准（2014年修订）》表1-1～表1-16，不含大学列、不含附加分表。 */
export const K12_NATIONAL_FITNESS_BASE_TABLES: NationalFitnessScoreTable[] = [
  {
    "id": "nf2014-bmi-一年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "一年级",
    "gender": "male",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 13.5,
        "max": 18.1,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 13.4,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 18.2,
        "max": 20.3,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 20.4,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-1",
      "tableName": "男生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "一年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-二年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "二年级",
    "gender": "male",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 13.7,
        "max": 18.4,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 13.6,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 18.5,
        "max": 20.4,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 20.5,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-1",
      "tableName": "男生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "二年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-三年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "三年级",
    "gender": "male",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 13.9,
        "max": 19.4,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 13.8,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 19.5,
        "max": 22.1,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 22.2,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-1",
      "tableName": "男生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "三年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-四年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "四年级",
    "gender": "male",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 14.2,
        "max": 20.1,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 14.1,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 20.2,
        "max": 22.6,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 22.7,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-1",
      "tableName": "男生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "四年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-五年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "五年级",
    "gender": "male",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 14.4,
        "max": 21.4,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 14.3,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 21.5,
        "max": 24.1,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 24.2,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-1",
      "tableName": "男生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "五年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-六年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "六年级",
    "gender": "male",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 14.7,
        "max": 21.8,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 14.6,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 21.9,
        "max": 24.5,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 24.6,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-1",
      "tableName": "男生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "六年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-初一-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初一",
    "gender": "male",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 15.5,
        "max": 22.1,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 15.4,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 22.2,
        "max": 24.9,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 25,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-1",
      "tableName": "男生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "初一",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-初二-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初二",
    "gender": "male",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 15.7,
        "max": 22.5,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 15.6,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 22.6,
        "max": 25.2,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 25.3,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-1",
      "tableName": "男生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "初二",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-初三-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初三",
    "gender": "male",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 15.8,
        "max": 22.8,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 15.7,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 22.9,
        "max": 26,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 26.1,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-1",
      "tableName": "男生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "初三",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-高一-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高一",
    "gender": "male",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 16.5,
        "max": 23.2,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 16.4,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 23.3,
        "max": 26.3,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 26.4,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-1",
      "tableName": "男生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "高一",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-高二-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高二",
    "gender": "male",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 16.8,
        "max": 23.7,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 16.7,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 23.8,
        "max": 26.5,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 26.6,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-1",
      "tableName": "男生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "高二",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-高三-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高三",
    "gender": "male",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 17.3,
        "max": 23.8,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 17.2,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 23.9,
        "max": 27.3,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 27.4,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-1",
      "tableName": "男生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "高三",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-一年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "一年级",
    "gender": "female",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 13.3,
        "max": 17.3,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 13.2,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 17.4,
        "max": 19.2,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 19.3,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-2",
      "tableName": "女生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "一年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-二年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "二年级",
    "gender": "female",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 13.5,
        "max": 17.8,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 13.4,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 17.9,
        "max": 20.2,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 20.3,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-2",
      "tableName": "女生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "二年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-三年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "三年级",
    "gender": "female",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 13.6,
        "max": 18.6,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 13.5,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 18.7,
        "max": 21.1,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 21.2,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-2",
      "tableName": "女生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "三年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-四年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "四年级",
    "gender": "female",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 13.7,
        "max": 19.4,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 13.6,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 19.5,
        "max": 22,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 22.1,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-2",
      "tableName": "女生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "四年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-五年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "五年级",
    "gender": "female",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 13.8,
        "max": 20.5,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 13.7,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 20.6,
        "max": 22.9,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 23,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-2",
      "tableName": "女生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "五年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-六年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "六年级",
    "gender": "female",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 14.2,
        "max": 20.8,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 14.1,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 20.9,
        "max": 23.6,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 23.7,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-2",
      "tableName": "女生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "六年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-初一-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初一",
    "gender": "female",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 14.8,
        "max": 21.7,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 14.7,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 21.8,
        "max": 24.4,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 24.5,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-2",
      "tableName": "女生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "初一",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-初二-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初二",
    "gender": "female",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 15.3,
        "max": 22.2,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 15.2,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 22.3,
        "max": 24.8,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 24.9,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-2",
      "tableName": "女生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "初二",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-初三-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初三",
    "gender": "female",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 16,
        "max": 22.6,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 15.9,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 22.7,
        "max": 25.1,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 25.2,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-2",
      "tableName": "女生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "初三",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-高一-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高一",
    "gender": "female",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 16.5,
        "max": 22.7,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 16.4,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 22.8,
        "max": 25.2,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 25.3,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-2",
      "tableName": "女生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "高一",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-高二-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高二",
    "gender": "female",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 16.9,
        "max": 23.2,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 16.8,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 23.3,
        "max": 25.4,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 25.5,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-2",
      "tableName": "女生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "高二",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-bmi-高三-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高三",
    "gender": "female",
    "itemId": "bmi",
    "unit": "other",
    "unitLabel": "kg/m²",
    "valueKind": "number",
    "ruleKind": "range",
    "maxBaseScore": 100,
    "minBaseScore": 60,
    "rangeEntries": [
      {
        "min": 17.1,
        "max": 23.3,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 100
      },
      {
        "min": null,
        "max": 17,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 23.4,
        "max": 25.7,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 80
      },
      {
        "min": 25.8,
        "max": null,
        "minInclusive": true,
        "maxInclusive": true,
        "score": 60
      }
    ],
    "thresholdEntries": [],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-2",
      "tableName": "女生体重指数（BMI）单项评分表",
      "itemId": "bmi",
      "grade": "高三",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-一年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "一年级",
    "gender": "male",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 1700,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 1600,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 1500,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 1400,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 1300,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 1240,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 1180,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 1120,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 1060,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 1000,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 940,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 880,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 820,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 760,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 700,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 660,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 620,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 580,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 540,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 500,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-3",
      "tableName": "男生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "一年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-二年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "二年级",
    "gender": "male",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 2000,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 1900,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 1800,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 1650,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 1500,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 1430,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 1360,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 1290,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 1220,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 1150,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 1080,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 1010,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 940,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 870,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 800,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 750,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 700,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 650,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 600,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 550,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-3",
      "tableName": "男生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "二年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-三年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "三年级",
    "gender": "male",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 2300,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 2200,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 2100,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 1900,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 1700,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 1620,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 1540,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 1460,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 1380,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 1300,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 1220,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 1140,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 1060,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 980,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 900,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 840,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 780,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 720,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 660,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 600,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-3",
      "tableName": "男生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "三年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-四年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "四年级",
    "gender": "male",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 2600,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 2500,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 2400,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 2150,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 1900,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 1820,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 1740,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 1660,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 1580,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 1500,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 1420,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 1340,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 1260,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 1180,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 1100,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1030,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 960,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 890,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 820,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 750,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-3",
      "tableName": "男生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "四年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-五年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "五年级",
    "gender": "male",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 2900,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 2800,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 2700,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 2450,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 2200,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 2110,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 2020,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 1930,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 1840,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 1750,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 1660,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 1570,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 1480,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 1390,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 1300,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1220,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 1140,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 1060,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 980,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 900,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-3",
      "tableName": "男生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "五年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-六年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "六年级",
    "gender": "male",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 3200,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 3100,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 3000,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 2750,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 2500,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 2400,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 2300,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 2200,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 2100,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 2000,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 1900,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 1800,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 1700,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 1600,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 1500,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1410,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 1320,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 1230,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 1140,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 1050,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-3",
      "tableName": "男生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "六年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-初一-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初一",
    "gender": "male",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 3640,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 3520,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 3400,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 3150,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 2900,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 2780,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 2660,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 2540,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 2420,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 2300,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 2180,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 2060,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 1940,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 1820,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 1700,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1600,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 1500,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 1400,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 1300,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 1200,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-3",
      "tableName": "男生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "初一",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-初二-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初二",
    "gender": "male",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 3940,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 3820,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 3700,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 3450,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 3200,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 3080,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 2960,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 2840,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 2720,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 2600,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 2480,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 2360,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 2240,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 2120,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 2000,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1890,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 1780,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 1670,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 1560,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 1450,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-3",
      "tableName": "男生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "初二",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-初三-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初三",
    "gender": "male",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 4240,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 4120,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 4000,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 3750,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 3500,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 3380,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 3260,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 3140,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 3020,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 2900,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 2780,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 2660,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 2540,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 2420,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 2300,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 2180,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 2060,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 1940,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 1820,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 1700,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-3",
      "tableName": "男生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "初三",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-高一-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高一",
    "gender": "male",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 4540,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 4420,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 4300,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 4050,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 3800,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 3680,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 3560,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 3440,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 3320,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 3200,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 3080,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 2960,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 2840,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 2720,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 2600,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 2470,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 2340,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 2210,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 2080,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 1950,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-3",
      "tableName": "男生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "高一",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-高二-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高二",
    "gender": "male",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 4740,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 4620,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 4500,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 4250,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 4000,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 3880,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 3760,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 3640,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 3520,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 3400,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 3280,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 3160,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 3040,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 2920,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 2800,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 2660,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 2520,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 2380,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 2240,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 2100,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-3",
      "tableName": "男生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "高二",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-高三-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高三",
    "gender": "male",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 4940,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 4820,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 4700,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 4450,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 4200,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 4080,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 3960,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 3840,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 3720,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 3600,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 3480,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 3360,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 3240,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 3120,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 3000,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 2850,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 2700,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 2550,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 2400,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 2250,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-3",
      "tableName": "男生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "高三",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-一年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "一年级",
    "gender": "female",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 1400,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 1300,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 1200,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 1100,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 1000,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 960,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 920,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 880,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 840,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 800,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 760,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 720,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 680,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 640,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 600,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 580,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 560,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 540,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 520,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 500,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-4",
      "tableName": "女生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "一年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-二年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "二年级",
    "gender": "female",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 1600,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 1500,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 1400,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 1300,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 1200,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 1150,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 1100,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 1050,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 1000,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 950,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 900,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 850,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 800,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 750,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 700,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 680,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 660,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 640,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 620,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 600,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-4",
      "tableName": "女生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "二年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-三年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "三年级",
    "gender": "female",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 1800,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 1700,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 1600,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 1500,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 1400,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 1340,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 1280,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 1220,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 1160,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 1100,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 1040,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 980,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 920,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 860,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 800,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 780,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 760,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 740,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 720,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 700,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-4",
      "tableName": "女生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "三年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-四年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "四年级",
    "gender": "female",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 2000,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 1900,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 1800,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 1700,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 1600,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 1530,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 1460,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 1390,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 1320,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 1250,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 1180,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 1110,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 1040,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 970,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 900,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 880,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 860,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 840,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 820,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 800,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-4",
      "tableName": "女生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "四年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-五年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "五年级",
    "gender": "female",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 2250,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 2150,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 2050,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 1950,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 1850,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 1770,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 1690,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 1610,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 1530,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 1450,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 1370,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 1290,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 1210,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 1130,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 1050,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1020,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 990,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 960,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 930,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 900,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-4",
      "tableName": "女生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "五年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-六年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "六年级",
    "gender": "female",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 2500,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 2400,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 2300,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 2200,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 2100,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 2010,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 1920,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 1830,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 1740,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 1650,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 1560,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 1470,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 1380,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 1290,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 1200,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1170,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 1140,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 1110,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 1080,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 1050,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-4",
      "tableName": "女生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "六年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-初一-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初一",
    "gender": "female",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 2750,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 2650,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 2550,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 2450,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 2350,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 2250,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 2150,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 2050,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 1950,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 1850,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 1750,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 1650,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 1550,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 1450,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 1350,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1310,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 1270,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 1230,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 1190,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 1150,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-4",
      "tableName": "女生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "初一",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-初二-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初二",
    "gender": "female",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 2900,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 2850,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 2800,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 2650,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 2500,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 2400,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 2300,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 2200,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 2100,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 2000,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 1900,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 1800,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 1700,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 1600,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 1500,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1460,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 1420,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 1380,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 1340,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 1300,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-4",
      "tableName": "女生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "初二",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-初三-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初三",
    "gender": "female",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 3050,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 3000,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 2950,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 2800,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 2650,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 2550,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 2450,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 2350,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 2250,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 2150,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 2050,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 1950,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 1850,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 1750,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 1650,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1610,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 1570,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 1530,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 1490,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 1450,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-4",
      "tableName": "女生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "初三",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-高一-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高一",
    "gender": "female",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 3150,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 3100,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 3050,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 2900,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 2750,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 2650,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 2550,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 2450,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 2350,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 2250,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 2150,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 2050,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 1950,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 1850,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 1750,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1710,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 1670,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 1630,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 1590,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 1550,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-4",
      "tableName": "女生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "高一",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-高二-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高二",
    "gender": "female",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 3250,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 3200,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 3150,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 3000,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 2850,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 2750,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 2650,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 2550,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 2450,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 2350,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 2250,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 2150,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 2050,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 1950,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 1850,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1810,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 1770,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 1730,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 1690,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 1650,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-4",
      "tableName": "女生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "高二",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-vital-capacity-高三-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高三",
    "gender": "female",
    "itemId": "vital-capacity",
    "unit": "ml",
    "unitLabel": "mL",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 3350,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 3300,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 3250,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 3100,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 2950,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 2850,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 2750,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 2650,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 2550,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 2450,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 2350,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 2250,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 2150,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 2050,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 1950,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1910,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 1870,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 1830,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 1790,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 1750,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-4",
      "tableName": "女生肺活量单项评分表",
      "itemId": "vital-capacity",
      "grade": "高三",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-一年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "一年级",
    "gender": "male",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 10.3,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 10.4,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 10.5,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 10.6,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 10.8,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 11.2,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 11.4,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 11.6,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 11.8,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 12.2,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 12.4,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 12.6,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 12.8,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 13.2,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 13.4,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 13.6,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-5",
      "tableName": "男生50米跑单项评分表",
      "itemId": "50m",
      "grade": "一年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-二年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "二年级",
    "gender": "male",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 9.6,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 9.7,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 9.8,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 9.9,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 10.4,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 10.6,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 10.8,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 11.2,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 11.4,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 11.6,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 11.8,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 12.2,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 12.4,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 12.6,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 12.8,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-5",
      "tableName": "男生50米跑单项评分表",
      "itemId": "50m",
      "grade": "二年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-三年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "三年级",
    "gender": "male",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 9.1,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 9.2,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 9.3,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 9.4,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 9.5,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 9.7,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 9.9,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 10.1,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 10.3,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 10.5,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 10.7,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 10.9,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 11.1,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 11.3,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 11.5,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 11.7,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 11.9,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 12.1,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 12.3,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 12.5,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-5",
      "tableName": "男生50米跑单项评分表",
      "itemId": "50m",
      "grade": "三年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-四年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "四年级",
    "gender": "male",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 8.7,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 8.8,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 8.9,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 9.1,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 9.3,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 9.5,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9.7,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 9.9,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 10.1,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 10.3,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 10.5,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 10.7,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 10.9,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 11.1,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 11.3,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 11.5,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 11.7,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 11.9,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 12.1,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-5",
      "tableName": "男生50米跑单项评分表",
      "itemId": "50m",
      "grade": "四年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-五年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "五年级",
    "gender": "male",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 8.4,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 8.5,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 8.6,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 8.7,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 8.8,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 9.2,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9.4,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 9.6,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 9.8,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 10.4,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 10.6,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 10.8,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 11.2,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 11.4,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 11.6,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 11.8,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-5",
      "tableName": "男生50米跑单项评分表",
      "itemId": "50m",
      "grade": "五年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-六年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "六年级",
    "gender": "male",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 8.2,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 8.3,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 8.4,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 8.5,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 8.6,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 8.8,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9.2,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 9.4,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 9.6,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 9.8,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 10.4,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 10.6,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 10.8,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 11.2,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 11.4,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 11.6,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-5",
      "tableName": "男生50米跑单项评分表",
      "itemId": "50m",
      "grade": "六年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-初一-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初一",
    "gender": "male",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 7.8,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 7.9,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 8.1,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 8.2,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 8.4,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 8.6,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 8.8,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 9.2,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 9.4,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 9.6,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 9.8,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 10.4,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 10.6,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 10.8,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 11.2,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-5",
      "tableName": "男生50米跑单项评分表",
      "itemId": "50m",
      "grade": "初一",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-初二-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初二",
    "gender": "male",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 7.5,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 7.6,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 7.7,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 7.8,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 7.9,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 8.1,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 8.3,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 8.5,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 8.7,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 8.9,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 9.1,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 9.3,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 9.5,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 9.7,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 9.9,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 10.1,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 10.3,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 10.5,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 10.7,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 10.9,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-5",
      "tableName": "男生50米跑单项评分表",
      "itemId": "50m",
      "grade": "初二",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-初三-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初三",
    "gender": "male",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 7.3,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 7.4,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 7.5,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 7.6,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 7.7,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 7.9,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 8.1,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 8.3,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 8.5,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 8.7,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 8.9,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 9.1,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 9.3,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 9.5,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 9.7,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 9.9,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 10.1,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 10.3,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 10.5,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 10.7,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-5",
      "tableName": "男生50米跑单项评分表",
      "itemId": "50m",
      "grade": "初三",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-高一-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高一",
    "gender": "male",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 7.1,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 7.2,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 7.3,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 7.4,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 7.5,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 7.7,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 7.9,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 8.1,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 8.3,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 8.5,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 8.7,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 8.9,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 9.1,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 9.3,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 9.5,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 9.7,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 9.9,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 10.1,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 10.3,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 10.5,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-5",
      "tableName": "男生50米跑单项评分表",
      "itemId": "50m",
      "grade": "高一",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-高二-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高二",
    "gender": "male",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 7,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 7.1,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 7.2,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 7.3,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 7.4,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 7.6,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 7.8,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 8.2,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 8.4,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 8.6,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 8.8,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 9.2,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 9.4,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 9.6,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 9.8,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 10.4,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-5",
      "tableName": "男生50米跑单项评分表",
      "itemId": "50m",
      "grade": "高二",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-高三-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高三",
    "gender": "male",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 6.8,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 6.9,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 7,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 7.1,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 7.2,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 7.4,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 7.6,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 7.8,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 8.2,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 8.4,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 8.6,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 8.8,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 9.2,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 9.4,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 9.6,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 9.8,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-5",
      "tableName": "男生50米跑单项评分表",
      "itemId": "50m",
      "grade": "高三",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-一年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "一年级",
    "gender": "female",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 11,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 11.1,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 11.2,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 11.5,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 11.8,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 12.2,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 12.4,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 12.6,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 12.8,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 13.2,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 13.4,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 13.6,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 13.8,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 14,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 14.2,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 14.4,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 14.6,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 14.8,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-6",
      "tableName": "女生50米跑单项评分表",
      "itemId": "50m",
      "grade": "一年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-二年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "二年级",
    "gender": "female",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 10,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 10.1,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 10.5,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 10.8,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 11.2,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 11.4,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 11.6,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 11.8,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 12.2,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 12.4,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 12.6,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 12.8,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 13.2,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 13.4,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 13.6,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 13.8,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-6",
      "tableName": "女生50米跑单项评分表",
      "itemId": "50m",
      "grade": "二年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-三年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "三年级",
    "gender": "female",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 9.2,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 9.3,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 9.4,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 9.7,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 10.4,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 10.6,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 10.8,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 11.2,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 11.4,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 11.6,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 11.8,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 12.2,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 12.4,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 12.6,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 12.8,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-6",
      "tableName": "女生50米跑单项评分表",
      "itemId": "50m",
      "grade": "三年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-四年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "四年级",
    "gender": "female",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 8.7,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 8.8,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 8.9,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 9.2,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 9.5,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 9.7,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 9.9,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 10.1,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 10.3,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 10.5,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 10.7,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 10.9,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 11.1,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 11.3,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 11.5,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 11.7,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 11.9,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 12.1,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 12.3,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 12.5,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-6",
      "tableName": "女生50米跑单项评分表",
      "itemId": "50m",
      "grade": "四年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-五年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "五年级",
    "gender": "female",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 8.3,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 8.4,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 8.5,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 8.8,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 9.1,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 9.3,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 9.5,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9.7,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 9.9,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 10.1,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 10.3,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 10.5,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 10.7,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 10.9,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 11.1,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 11.3,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 11.5,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 11.7,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 11.9,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 12.1,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-6",
      "tableName": "女生50米跑单项评分表",
      "itemId": "50m",
      "grade": "五年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-六年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "六年级",
    "gender": "female",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 8.2,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 8.3,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 8.4,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 8.7,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 9.2,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 9.4,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9.6,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 9.8,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 10.4,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 10.6,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 10.8,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 11.2,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 11.4,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 11.6,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 11.8,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-6",
      "tableName": "女生50米跑单项评分表",
      "itemId": "50m",
      "grade": "六年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-初一-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初一",
    "gender": "female",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 8.1,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 8.2,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 8.3,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 8.6,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 8.9,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 9.1,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 9.3,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9.5,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 9.7,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 9.9,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 10.1,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 10.3,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 10.5,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 10.7,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 10.9,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 11.1,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 11.3,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 11.5,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 11.7,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 11.9,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-6",
      "tableName": "女生50米跑单项评分表",
      "itemId": "50m",
      "grade": "初一",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-初二-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初二",
    "gender": "female",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 8,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 8.1,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 8.2,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 8.5,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 8.8,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 9.2,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9.4,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 9.6,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 9.8,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 10.4,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 10.6,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 10.8,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 11.2,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 11.4,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 11.6,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 11.8,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-6",
      "tableName": "女生50米跑单项评分表",
      "itemId": "50m",
      "grade": "初二",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-初三-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初三",
    "gender": "female",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 7.9,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 8.1,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 8.4,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 8.7,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 8.9,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 9.1,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9.3,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 9.5,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 9.7,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 9.9,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 10.1,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 10.3,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 10.5,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 10.7,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 10.9,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 11.1,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 11.3,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 11.5,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 11.7,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-6",
      "tableName": "女生50米跑单项评分表",
      "itemId": "50m",
      "grade": "初三",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-高一-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高一",
    "gender": "female",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 7.8,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 7.9,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 8.3,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 8.6,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 8.8,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9.2,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 9.4,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 9.6,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 9.8,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 10.4,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 10.6,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 10.8,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 11.2,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 11.4,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 11.6,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-6",
      "tableName": "女生50米跑单项评分表",
      "itemId": "50m",
      "grade": "高一",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-高二-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高二",
    "gender": "female",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 7.7,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 7.8,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 7.9,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 8.2,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 8.5,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 8.7,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 8.9,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9.1,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 9.3,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 9.5,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 9.7,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 9.9,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 10.1,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 10.3,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 10.5,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 10.7,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 10.9,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 11.1,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 11.3,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 11.5,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-6",
      "tableName": "女生50米跑单项评分表",
      "itemId": "50m",
      "grade": "高二",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-50m-高三-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高三",
    "gender": "female",
    "itemId": "50m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 7.6,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 7.7,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 7.8,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 8.1,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 8.4,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 8.6,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 8.8,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 9.2,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 9.4,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 9.6,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 9.8,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 10.4,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 10.6,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 10.8,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 11.2,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 11.4,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-6",
      "tableName": "女生50米跑单项评分表",
      "itemId": "50m",
      "grade": "高三",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-一年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "一年级",
    "gender": "male",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 16.1,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 14.6,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 9.9,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 8.8,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 7.7,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 6.6,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 5.5,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 4.4,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 3.3,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 2.2,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 1.1,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 0,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": -0.8,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": -1.6,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -2.4,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -3.2,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -4,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-7",
      "tableName": "男生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "一年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-二年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "二年级",
    "gender": "male",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 16.2,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 14.7,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 13.2,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 11.9,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 10.6,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 9.5,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 8.4,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 7.3,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 6.2,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 5.1,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 4,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 2.9,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 1.8,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 0.7,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": -0.4,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": -1.2,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": -2,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -2.8,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -3.6,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -4.4,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-7",
      "tableName": "男生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "二年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-三年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "三年级",
    "gender": "male",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 16.3,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 14.9,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 13.4,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 11.8,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 9.1,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 6.9,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 5.8,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 4.7,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 3.6,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 2.5,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 1.4,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 0.3,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": -0.8,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": -1.6,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": -2.4,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -3.2,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -4,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -4.8,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-7",
      "tableName": "男生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "三年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-四年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "四年级",
    "gender": "male",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 16.4,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 15,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 13.6,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 11.7,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 9.8,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 8.6,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 7.4,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 6.2,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 5,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 3.8,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 2.6,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 1.4,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 0.2,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": -1,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": -2.2,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": -3.2,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": -4.2,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -5.2,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -6.2,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -7.2,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-7",
      "tableName": "男生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "四年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-五年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "五年级",
    "gender": "male",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 16.5,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 15.2,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 13.8,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 11.6,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 9.4,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 8.2,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 7,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 5.8,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 4.6,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 3.4,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 2.2,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 1,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": -0.2,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": -1.4,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": -2.6,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": -3.6,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": -4.6,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -5.6,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -6.6,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -7.6,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-7",
      "tableName": "男生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "五年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-六年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "六年级",
    "gender": "male",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 16.6,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 15.3,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 14,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 11.5,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 7.7,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 6.4,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 5.1,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 3.8,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 2.5,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 1.2,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": -0.1,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": -1.4,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": -2.7,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": -4,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": -5,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": -6,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -7,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -8,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -9,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-7",
      "tableName": "男生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "六年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-初一-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初一",
    "gender": "male",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 17.6,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 15.9,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 14.2,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 12.3,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 10.4,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 9.1,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 7.8,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 6.5,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 5.2,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 3.9,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 2.6,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 1.3,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 0,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": -1.3,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": -2.6,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": -3.8,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": -5,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -6.2,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -7.4,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -8.6,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-7",
      "tableName": "男生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "初一",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-初二-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初二",
    "gender": "male",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 19.6,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 17.7,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 15.8,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 13.7,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 11.6,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 10.3,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 7.7,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 6.4,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 5.1,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 3.8,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 2.5,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 1.2,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": -0.1,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": -1.4,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": -2.6,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": -3.8,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -5,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -6.2,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -7.4,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-7",
      "tableName": "男生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "初二",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-初三-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初三",
    "gender": "male",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 21.6,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 19.7,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 17.8,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 15.8,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 13.8,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 12.4,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9.6,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 8.2,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 6.8,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 5.4,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 4,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 2.6,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 1.2,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": -0.2,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": -1.4,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": -2.6,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -3.8,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -5,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -6.2,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-7",
      "tableName": "男生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "初三",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-高一-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高一",
    "gender": "male",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 23.6,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 21.5,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 19.4,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 17.2,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 15,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 13.6,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 12.2,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 10.8,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 9.4,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 6.6,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 5.2,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 3.8,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 2.4,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 1,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 0,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": -1,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -2,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -3,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -4,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-7",
      "tableName": "男生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "高一",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-高二-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高二",
    "gender": "male",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 24.3,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 22.4,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 20.5,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 18.3,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 16.1,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 14.7,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 13.3,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 11.9,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 10.5,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 9.1,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 7.7,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 6.3,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 4.9,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 3.5,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 2.1,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1.1,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 0.1,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -0.9,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -1.9,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -2.9,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-7",
      "tableName": "男生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "高二",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-高三-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高三",
    "gender": "male",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 24.6,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 22.8,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 21,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 19.1,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 17.2,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 15.8,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 14.4,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 11.6,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 8.8,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 7.4,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 6,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 4.6,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 3.2,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 2.2,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 1.2,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 0.2,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -0.8,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -1.8,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-7",
      "tableName": "男生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "高三",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-一年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "一年级",
    "gender": "female",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 18.6,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 17.3,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 16,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 14.7,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 13.4,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 12.3,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 11.2,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 10.1,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 7.9,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 6.8,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 5.7,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 4.6,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 3.5,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 2.4,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1.6,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 0.8,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 0,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -0.8,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -1.6,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-8",
      "tableName": "女生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "一年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-二年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "二年级",
    "gender": "female",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 18.9,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 17.6,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 16.3,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 14.8,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 13.3,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 12.2,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 11.1,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 8.9,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 7.8,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 6.7,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 5.6,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 4.5,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 3.4,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 2.3,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1.5,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 0.7,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -0.1,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -0.9,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -1.7,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-8",
      "tableName": "女生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "二年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-三年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "三年级",
    "gender": "female",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 19.2,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 17.9,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 16.6,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 14.9,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 13.2,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 12.1,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9.9,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 8.8,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 7.7,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 6.6,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 5.5,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 4.4,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 3.3,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 2.2,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1.4,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 0.6,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -0.2,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -1,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -1.8,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-8",
      "tableName": "女生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "三年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-四年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "四年级",
    "gender": "female",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 19.5,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 18.1,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 16.9,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 15,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 13.1,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 10.9,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9.8,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 8.7,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 7.6,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 6.5,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 5.4,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 4.3,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 3.2,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 2.1,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1.3,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 0.5,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -0.3,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -1.1,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -1.9,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-8",
      "tableName": "女生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "四年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-五年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "五年级",
    "gender": "female",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 19.8,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 18.5,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 17.2,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 15.1,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 11.9,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 10.8,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9.7,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 8.6,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 7.5,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 6.4,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 5.3,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 4.2,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 3.1,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 2,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1.2,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 0.4,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -0.4,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -1.2,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -2,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-8",
      "tableName": "女生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "五年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-六年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "六年级",
    "gender": "female",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 19.9,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 18.7,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 17.5,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 15.2,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 12.9,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 11.8,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 10.7,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9.6,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 8.5,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 7.4,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 6.3,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 5.2,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 4.1,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 3,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 1.9,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1.1,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 0.3,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -0.5,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -1.3,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -2.1,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-8",
      "tableName": "女生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "六年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-初一-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初一",
    "gender": "female",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 21.8,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 20.1,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 18.4,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 16.7,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 15,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 13.7,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 12.4,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 11.1,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 9.8,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 8.5,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 7.2,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 5.9,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 4.6,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 3.3,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 2,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 1.2,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 0.4,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": -0.4,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -1.2,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -2,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-8",
      "tableName": "女生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "初一",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-初二-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初二",
    "gender": "female",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 22.7,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 21,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 19.3,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 17.6,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 15.9,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 14.6,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 13.3,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 10.7,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 9.4,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 8.1,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 6.8,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 5.5,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 4.2,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 2.9,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 2.1,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 1.3,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 0.5,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": -0.3,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -1.1,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-8",
      "tableName": "女生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "初二",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-初三-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初三",
    "gender": "female",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 23.5,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 21.8,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 20.1,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 18.4,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 16.7,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 15.4,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 14.1,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 12.8,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 11.5,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 8.9,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 7.6,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 6.3,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 5,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 3.7,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 2.9,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 2.1,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 1.3,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 0.5,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": -0.3,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-8",
      "tableName": "女生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "初三",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-高一-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高一",
    "gender": "female",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 24.2,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 22.5,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 20.8,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 19.1,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 17.4,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 16.1,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 14.8,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 13.5,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 12.2,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 10.9,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 9.6,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 8.3,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 7,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 5.7,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 4.4,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 3.6,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 2.8,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 2,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 1.2,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 0.4,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-8",
      "tableName": "女生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "高一",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-高二-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高二",
    "gender": "female",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 24.8,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 23.1,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 21.4,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 19.7,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 18,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 16.7,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 15.4,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 14.1,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 12.8,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 11.5,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 10.2,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 8.9,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 7.6,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 6.3,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 5,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 4.2,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 3.4,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 2.6,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 1.8,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 1,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-8",
      "tableName": "女生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "高二",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-and-reach-高三-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高三",
    "gender": "female",
    "itemId": "sit-and-reach",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 25.3,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 23.6,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 21.9,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 20.2,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 18.5,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 17.2,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 15.9,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 14.6,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 13.3,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 10.7,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 9.4,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 8.1,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 6.8,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 5.5,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 4.7,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 3.9,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 3.1,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 2.3,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 1.5,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-8",
      "tableName": "女生坐位体前屈单项评分表",
      "itemId": "sit-and-reach",
      "grade": "高三",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-skip-1min-一年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "一年级",
    "gender": "male",
    "itemId": "skip-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 109,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 104,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 99,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 93,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 87,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 80,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 73,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 66,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 59,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 52,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 45,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 38,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 31,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 24,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 17,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 14,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 5,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 2,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-9",
      "tableName": "男生一分钟跳绳单项评分表",
      "itemId": "skip-1min",
      "grade": "一年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-skip-1min-二年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "二年级",
    "gender": "male",
    "itemId": "skip-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 117,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 112,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 107,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 101,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 95,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 88,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 81,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 74,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 67,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 60,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 53,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 46,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 39,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 32,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 25,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 22,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 19,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 16,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-9",
      "tableName": "男生一分钟跳绳单项评分表",
      "itemId": "skip-1min",
      "grade": "二年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-skip-1min-三年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "三年级",
    "gender": "male",
    "itemId": "skip-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 126,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 121,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 116,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 110,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 104,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 97,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 90,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 83,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 76,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 69,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 62,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 55,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 48,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 41,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 34,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 31,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 28,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 25,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 22,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 19,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-9",
      "tableName": "男生一分钟跳绳单项评分表",
      "itemId": "skip-1min",
      "grade": "三年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-skip-1min-四年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "四年级",
    "gender": "male",
    "itemId": "skip-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 137,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 132,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 127,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 121,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 115,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 108,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 101,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 94,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 87,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 80,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 73,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 66,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 59,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 52,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 45,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 42,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 39,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 36,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 33,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 30,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-9",
      "tableName": "男生一分钟跳绳单项评分表",
      "itemId": "skip-1min",
      "grade": "四年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-skip-1min-五年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "五年级",
    "gender": "male",
    "itemId": "skip-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 148,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 143,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 138,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 132,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 126,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 119,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 112,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 105,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 98,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 91,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 84,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 77,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 70,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 63,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 56,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 53,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 50,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 47,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 44,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 41,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-9",
      "tableName": "男生一分钟跳绳单项评分表",
      "itemId": "skip-1min",
      "grade": "五年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-skip-1min-六年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "六年级",
    "gender": "male",
    "itemId": "skip-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 157,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 152,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 147,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 141,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 135,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 128,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 121,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 114,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 107,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 100,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 93,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 86,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 79,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 72,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 65,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 62,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 59,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 56,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 53,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 50,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-9",
      "tableName": "男生一分钟跳绳单项评分表",
      "itemId": "skip-1min",
      "grade": "六年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-skip-1min-一年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "一年级",
    "gender": "female",
    "itemId": "skip-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 117,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 110,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 103,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 95,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 87,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 80,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 73,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 66,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 59,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 52,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 45,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 38,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 31,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 24,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 17,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 14,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 5,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 2,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-10",
      "tableName": "女生一分钟跳绳单项评分表",
      "itemId": "skip-1min",
      "grade": "一年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-skip-1min-二年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "二年级",
    "gender": "female",
    "itemId": "skip-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 127,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 120,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 113,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 105,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 97,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 90,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 83,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 76,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 69,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 62,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 55,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 48,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 41,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 34,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 27,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 24,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 21,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 18,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 15,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-10",
      "tableName": "女生一分钟跳绳单项评分表",
      "itemId": "skip-1min",
      "grade": "二年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-skip-1min-三年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "三年级",
    "gender": "female",
    "itemId": "skip-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 139,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 132,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 125,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 117,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 109,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 102,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 95,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 88,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 81,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 74,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 67,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 60,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 53,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 46,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 39,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 36,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 33,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 30,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 27,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 24,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-10",
      "tableName": "女生一分钟跳绳单项评分表",
      "itemId": "skip-1min",
      "grade": "三年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-skip-1min-四年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "四年级",
    "gender": "female",
    "itemId": "skip-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 149,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 142,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 135,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 127,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 119,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 112,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 105,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 98,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 91,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 84,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 77,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 70,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 63,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 56,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 49,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 46,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 43,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 40,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 37,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 34,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-10",
      "tableName": "女生一分钟跳绳单项评分表",
      "itemId": "skip-1min",
      "grade": "四年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-skip-1min-五年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "五年级",
    "gender": "female",
    "itemId": "skip-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 158,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 151,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 144,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 136,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 128,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 121,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 114,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 107,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 100,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 93,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 86,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 79,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 72,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 65,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 58,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 55,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 52,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 49,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 46,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 43,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-10",
      "tableName": "女生一分钟跳绳单项评分表",
      "itemId": "skip-1min",
      "grade": "五年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-skip-1min-六年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "六年级",
    "gender": "female",
    "itemId": "skip-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 166,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 159,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 152,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 144,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 136,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 129,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 122,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 115,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 108,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 101,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 94,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 87,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 80,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 73,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 66,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 63,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 60,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 57,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 54,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 51,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-10",
      "tableName": "女生一分钟跳绳单项评分表",
      "itemId": "skip-1min",
      "grade": "六年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-standing-long-jump-初一-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初一",
    "gender": "male",
    "itemId": "standing-long-jump",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 225,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 218,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 211,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 203,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 195,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 191,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 187,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 183,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 179,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 175,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 171,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 167,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 163,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 159,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 155,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 150,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 145,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 140,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 135,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 130,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-11",
      "tableName": "男生立定跳远单项评分表",
      "itemId": "standing-long-jump",
      "grade": "初一",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-standing-long-jump-初二-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初二",
    "gender": "male",
    "itemId": "standing-long-jump",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 240,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 233,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 226,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 218,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 210,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 206,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 202,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 198,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 194,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 190,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 186,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 182,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 178,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 174,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 170,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 165,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 160,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 155,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 150,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 145,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-11",
      "tableName": "男生立定跳远单项评分表",
      "itemId": "standing-long-jump",
      "grade": "初二",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-standing-long-jump-初三-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初三",
    "gender": "male",
    "itemId": "standing-long-jump",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 250,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 245,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 240,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 233,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 225,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 221,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 217,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 213,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 209,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 205,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 201,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 197,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 193,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 189,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 185,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 180,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 175,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 170,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 165,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 160,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-11",
      "tableName": "男生立定跳远单项评分表",
      "itemId": "standing-long-jump",
      "grade": "初三",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-standing-long-jump-高一-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高一",
    "gender": "male",
    "itemId": "standing-long-jump",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 260,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 255,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 250,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 243,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 235,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 231,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 227,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 223,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 219,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 215,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 211,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 207,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 203,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 199,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 195,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 190,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 185,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 180,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 175,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 170,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-11",
      "tableName": "男生立定跳远单项评分表",
      "itemId": "standing-long-jump",
      "grade": "高一",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-standing-long-jump-高二-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高二",
    "gender": "male",
    "itemId": "standing-long-jump",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 265,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 260,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 255,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 248,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 240,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 236,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 232,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 228,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 224,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 220,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 216,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 212,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 208,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 204,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 200,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 195,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 190,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 185,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 180,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 175,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-11",
      "tableName": "男生立定跳远单项评分表",
      "itemId": "standing-long-jump",
      "grade": "高二",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-standing-long-jump-高三-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高三",
    "gender": "male",
    "itemId": "standing-long-jump",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 270,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 265,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 260,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 253,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 245,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 241,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 237,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 233,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 229,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 225,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 221,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 217,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 213,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 209,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 205,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 200,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 195,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 190,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 185,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 180,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-11",
      "tableName": "男生立定跳远单项评分表",
      "itemId": "standing-long-jump",
      "grade": "高三",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-standing-long-jump-初一-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初一",
    "gender": "female",
    "itemId": "standing-long-jump",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 196,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 190,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 184,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 177,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 170,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 167,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 164,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 161,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 158,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 155,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 152,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 149,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 146,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 143,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 140,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 135,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 130,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 125,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 120,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 115,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-12",
      "tableName": "女生立定跳远单项评分表",
      "itemId": "standing-long-jump",
      "grade": "初一",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-standing-long-jump-初二-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初二",
    "gender": "female",
    "itemId": "standing-long-jump",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 200,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 194,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 188,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 181,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 174,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 171,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 168,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 165,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 162,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 159,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 156,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 153,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 150,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 147,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 144,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 139,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 134,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 129,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 124,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 119,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-12",
      "tableName": "女生立定跳远单项评分表",
      "itemId": "standing-long-jump",
      "grade": "初二",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-standing-long-jump-初三-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初三",
    "gender": "female",
    "itemId": "standing-long-jump",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 202,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 196,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 190,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 183,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 176,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 173,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 170,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 167,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 164,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 161,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 158,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 155,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 152,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 149,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 146,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 141,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 136,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 131,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 126,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 121,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-12",
      "tableName": "女生立定跳远单项评分表",
      "itemId": "standing-long-jump",
      "grade": "初三",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-standing-long-jump-高一-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高一",
    "gender": "female",
    "itemId": "standing-long-jump",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 204,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 198,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 192,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 185,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 178,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 175,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 172,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 169,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 166,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 163,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 160,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 157,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 154,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 151,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 148,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 143,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 138,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 133,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 128,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 123,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-12",
      "tableName": "女生立定跳远单项评分表",
      "itemId": "standing-long-jump",
      "grade": "高一",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-standing-long-jump-高二-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高二",
    "gender": "female",
    "itemId": "standing-long-jump",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 205,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 199,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 193,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 186,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 179,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 176,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 173,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 170,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 167,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 164,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 161,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 158,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 155,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 152,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 149,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 144,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 139,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 134,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 129,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 124,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-12",
      "tableName": "女生立定跳远单项评分表",
      "itemId": "standing-long-jump",
      "grade": "高二",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-standing-long-jump-高三-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高三",
    "gender": "female",
    "itemId": "standing-long-jump",
    "unit": "cm",
    "unitLabel": "cm",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 206,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 200,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 194,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 187,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 180,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 177,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 174,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 171,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 168,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 165,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 162,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 159,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 156,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 153,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 150,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 145,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 140,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 135,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 130,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 125,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-12",
      "tableName": "女生立定跳远单项评分表",
      "itemId": "standing-long-jump",
      "grade": "高三",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-up-1min-三年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "三年级",
    "gender": "male",
    "itemId": "sit-up-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 48,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 45,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 42,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 39,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 36,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 34,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 32,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 30,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 28,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 26,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 24,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 22,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 20,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 18,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 16,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 14,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 6,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-13",
      "tableName": "男生一分钟仰卧起坐、引体向上单项评分表",
      "itemId": "sit-up-1min",
      "grade": "三年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-up-1min-四年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "四年级",
    "gender": "male",
    "itemId": "sit-up-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 49,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 46,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 43,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 40,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 37,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 35,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 33,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 31,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 29,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 27,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 25,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 23,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 21,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 19,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 17,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 15,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 7,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-13",
      "tableName": "男生一分钟仰卧起坐、引体向上单项评分表",
      "itemId": "sit-up-1min",
      "grade": "四年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-up-1min-五年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "五年级",
    "gender": "male",
    "itemId": "sit-up-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 50,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 47,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 44,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 41,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 38,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 36,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 34,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 32,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 30,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 28,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 26,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 24,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 22,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 20,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 18,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 16,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 14,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-13",
      "tableName": "男生一分钟仰卧起坐、引体向上单项评分表",
      "itemId": "sit-up-1min",
      "grade": "五年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-up-1min-六年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "六年级",
    "gender": "male",
    "itemId": "sit-up-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 51,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 48,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 45,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 42,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 39,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 37,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 35,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 33,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 31,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 29,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 27,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 25,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 23,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 21,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 19,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 17,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 15,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-13",
      "tableName": "男生一分钟仰卧起坐、引体向上单项评分表",
      "itemId": "sit-up-1min",
      "grade": "六年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-pull-up-初一-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初一",
    "gender": "male",
    "itemId": "pull-up",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 13,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 7,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 6,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 5,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 4,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 3,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 2,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 1,
        "inclusive": true,
        "score": 30
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-13",
      "tableName": "男生一分钟仰卧起坐、引体向上单项评分表",
      "itemId": "pull-up",
      "grade": "初一",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-pull-up-初二-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初二",
    "gender": "male",
    "itemId": "pull-up",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 14,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 7,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 6,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 5,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 4,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 3,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 2,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 1,
        "inclusive": true,
        "score": 20
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-13",
      "tableName": "男生一分钟仰卧起坐、引体向上单项评分表",
      "itemId": "pull-up",
      "grade": "初二",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-pull-up-初三-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初三",
    "gender": "male",
    "itemId": "pull-up",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 15,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 14,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 7,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 6,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 5,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 4,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 3,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 2,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 1,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-13",
      "tableName": "男生一分钟仰卧起坐、引体向上单项评分表",
      "itemId": "pull-up",
      "grade": "初三",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-pull-up-高一-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高一",
    "gender": "male",
    "itemId": "pull-up",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 16,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 15,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 14,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 7,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 6,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 5,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 4,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 3,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 2,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-13",
      "tableName": "男生一分钟仰卧起坐、引体向上单项评分表",
      "itemId": "pull-up",
      "grade": "高一",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-pull-up-高二-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高二",
    "gender": "male",
    "itemId": "pull-up",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 17,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 16,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 15,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 14,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 7,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 6,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 5,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 4,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 3,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-13",
      "tableName": "男生一分钟仰卧起坐、引体向上单项评分表",
      "itemId": "pull-up",
      "grade": "高二",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-pull-up-高三-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高三",
    "gender": "male",
    "itemId": "pull-up",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 18,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 17,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 16,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 15,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 14,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 7,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 6,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 5,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 4,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-13",
      "tableName": "男生一分钟仰卧起坐、引体向上单项评分表",
      "itemId": "pull-up",
      "grade": "高三",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-up-1min-三年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "三年级",
    "gender": "female",
    "itemId": "sit-up-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 46,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 44,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 42,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 39,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 36,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 34,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 32,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 30,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 28,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 26,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 24,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 22,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 20,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 18,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 16,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 14,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 6,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-14",
      "tableName": "女生一分钟仰卧起坐单项评分表",
      "itemId": "sit-up-1min",
      "grade": "三年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-up-1min-四年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "四年级",
    "gender": "female",
    "itemId": "sit-up-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 47,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 45,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 43,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 40,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 37,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 35,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 33,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 31,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 29,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 27,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 25,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 23,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 21,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 19,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 17,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 15,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 7,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-14",
      "tableName": "女生一分钟仰卧起坐单项评分表",
      "itemId": "sit-up-1min",
      "grade": "四年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-up-1min-五年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "五年级",
    "gender": "female",
    "itemId": "sit-up-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 48,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 46,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 44,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 41,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 38,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 36,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 34,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 32,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 30,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 28,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 26,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 24,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 22,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 20,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 18,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 16,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 14,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 8,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-14",
      "tableName": "女生一分钟仰卧起坐单项评分表",
      "itemId": "sit-up-1min",
      "grade": "五年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-up-1min-六年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "六年级",
    "gender": "female",
    "itemId": "sit-up-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 49,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 47,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 45,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 42,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 39,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 37,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 35,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 33,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 31,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 29,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 27,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 25,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 23,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 21,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 19,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 17,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 15,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 9,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-14",
      "tableName": "女生一分钟仰卧起坐单项评分表",
      "itemId": "sit-up-1min",
      "grade": "六年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-up-1min-初一-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初一",
    "gender": "female",
    "itemId": "sit-up-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 50,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 48,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 46,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 43,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 40,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 38,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 36,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 34,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 32,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 30,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 28,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 26,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 24,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 22,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 20,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 18,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 16,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 14,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 10,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-14",
      "tableName": "女生一分钟仰卧起坐单项评分表",
      "itemId": "sit-up-1min",
      "grade": "初一",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-up-1min-初二-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初二",
    "gender": "female",
    "itemId": "sit-up-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 51,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 49,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 47,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 44,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 41,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 39,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 37,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 35,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 33,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 31,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 29,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 27,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 25,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 23,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 21,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 19,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 17,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 15,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 11,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-14",
      "tableName": "女生一分钟仰卧起坐单项评分表",
      "itemId": "sit-up-1min",
      "grade": "初二",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-up-1min-初三-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初三",
    "gender": "female",
    "itemId": "sit-up-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 52,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 50,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 48,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 45,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 42,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 40,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 38,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 36,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 34,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 32,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 30,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 28,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 26,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 24,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 22,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 20,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 18,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 16,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 14,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 12,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-14",
      "tableName": "女生一分钟仰卧起坐单项评分表",
      "itemId": "sit-up-1min",
      "grade": "初三",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-up-1min-高一-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高一",
    "gender": "female",
    "itemId": "sit-up-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 53,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 51,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 49,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 46,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 43,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 41,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 39,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 37,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 35,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 33,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 31,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 29,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 27,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 25,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 23,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 21,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 19,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 17,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 15,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 13,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-14",
      "tableName": "女生一分钟仰卧起坐单项评分表",
      "itemId": "sit-up-1min",
      "grade": "高一",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-up-1min-高二-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高二",
    "gender": "female",
    "itemId": "sit-up-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 54,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 52,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 50,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 47,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 44,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 42,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 40,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 38,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 36,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 34,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 32,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 30,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 28,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 26,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 24,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 22,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 20,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 18,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 16,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 14,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-14",
      "tableName": "女生一分钟仰卧起坐单项评分表",
      "itemId": "sit-up-1min",
      "grade": "高二",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-sit-up-1min-高三-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高三",
    "gender": "female",
    "itemId": "sit-up-1min",
    "unit": "times",
    "unitLabel": "次",
    "valueKind": "number",
    "ruleKind": "higherBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 55,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 53,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 51,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 48,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 45,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 43,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 41,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 39,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 37,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 35,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 33,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 31,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 29,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 27,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 25,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 23,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 21,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 19,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 17,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 15,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-14",
      "tableName": "女生一分钟仰卧起坐单项评分表",
      "itemId": "sit-up-1min",
      "grade": "高三",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-shuttle-50m-8-五年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "五年级",
    "gender": "male",
    "itemId": "shuttle-50m-8",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 96,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 99,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 102,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 105,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 108,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 111,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 114,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 117,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 120,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 123,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 126,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 129,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 132,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 135,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 138,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 142,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 146,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 150,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 154,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 158,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-15",
      "tableName": "男生耐力跑单项评分表",
      "itemId": "shuttle-50m-8",
      "grade": "五年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-shuttle-50m-8-六年级-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "六年级",
    "gender": "male",
    "itemId": "shuttle-50m-8",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 90,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 93,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 96,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 99,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 102,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 105,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 108,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 111,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 114,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 117,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 120,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 123,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 126,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 129,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 132,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 136,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 140,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 144,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 148,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 152,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-15",
      "tableName": "男生耐力跑单项评分表",
      "itemId": "shuttle-50m-8",
      "grade": "六年级",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-run-1000m-初一-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初一",
    "gender": "male",
    "itemId": "run-1000m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 235,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 245,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 255,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 262,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 270,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 275,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 280,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 285,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 290,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 295,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 300,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 305,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 310,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 315,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 320,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 340,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 360,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 380,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 400,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 420,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-15",
      "tableName": "男生耐力跑单项评分表",
      "itemId": "run-1000m",
      "grade": "初一",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-run-1000m-初二-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初二",
    "gender": "male",
    "itemId": "run-1000m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 230,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 235,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 240,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 247,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 255,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 260,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 265,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 270,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 275,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 280,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 285,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 290,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 295,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 300,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 305,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 325,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 345,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 365,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 385,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 405,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-15",
      "tableName": "男生耐力跑单项评分表",
      "itemId": "run-1000m",
      "grade": "初二",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-run-1000m-初三-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初三",
    "gender": "male",
    "itemId": "run-1000m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 220,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 225,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 230,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 237,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 245,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 250,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 255,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 260,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 265,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 270,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 275,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 280,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 285,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 290,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 295,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 315,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 335,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 355,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 375,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 395,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-15",
      "tableName": "男生耐力跑单项评分表",
      "itemId": "run-1000m",
      "grade": "初三",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-run-1000m-高一-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高一",
    "gender": "male",
    "itemId": "run-1000m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 210,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 215,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 220,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 227,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 235,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 240,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 245,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 250,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 255,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 260,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 265,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 270,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 275,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 280,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 285,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 305,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 325,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 345,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 365,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 385,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-15",
      "tableName": "男生耐力跑单项评分表",
      "itemId": "run-1000m",
      "grade": "高一",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-run-1000m-高二-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高二",
    "gender": "male",
    "itemId": "run-1000m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 205,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 210,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 215,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 222,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 230,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 235,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 240,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 245,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 250,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 255,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 260,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 265,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 270,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 275,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 280,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 300,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 320,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 340,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 360,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 380,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-15",
      "tableName": "男生耐力跑单项评分表",
      "itemId": "run-1000m",
      "grade": "高二",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-run-1000m-高三-male",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高三",
    "gender": "male",
    "itemId": "run-1000m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 200,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 205,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 210,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 217,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 225,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 230,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 235,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 240,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 245,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 250,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 255,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 260,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 265,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 270,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 275,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 295,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 315,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 335,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 355,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 375,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-15",
      "tableName": "男生耐力跑单项评分表",
      "itemId": "run-1000m",
      "grade": "高三",
      "gender": "male"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-shuttle-50m-8-五年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "五年级",
    "gender": "female",
    "itemId": "shuttle-50m-8",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 101,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 104,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 107,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 110,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 113,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 116,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 119,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 122,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 125,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 128,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 131,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 134,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 137,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 140,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 143,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 147,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 151,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 155,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 159,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 163,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-16",
      "tableName": "女生耐力跑单项评分表",
      "itemId": "shuttle-50m-8",
      "grade": "五年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-shuttle-50m-8-六年级-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "六年级",
    "gender": "female",
    "itemId": "shuttle-50m-8",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 97,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 100,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 103,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 106,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 109,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 112,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 115,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 118,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 121,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 124,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 127,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 130,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 133,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 136,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 139,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 143,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 147,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 151,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 155,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 159,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-16",
      "tableName": "女生耐力跑单项评分表",
      "itemId": "shuttle-50m-8",
      "grade": "六年级",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-run-800m-初一-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初一",
    "gender": "female",
    "itemId": "run-800m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 215,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 222,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 229,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 237,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 245,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 250,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 255,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 260,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 265,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 270,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 275,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 280,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 285,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 290,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 295,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 305,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 315,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 325,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 335,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 345,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-16",
      "tableName": "女生耐力跑单项评分表",
      "itemId": "run-800m",
      "grade": "初一",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-run-800m-初二-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初二",
    "gender": "female",
    "itemId": "run-800m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 210,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 217,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 224,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 232,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 240,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 245,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 250,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 255,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 260,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 265,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 270,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 275,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 280,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 285,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 290,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 300,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 310,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 320,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 330,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 340,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-16",
      "tableName": "女生耐力跑单项评分表",
      "itemId": "run-800m",
      "grade": "初二",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-run-800m-初三-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "初三",
    "gender": "female",
    "itemId": "run-800m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 205,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 212,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 219,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 227,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 235,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 240,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 245,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 250,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 255,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 260,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 265,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 270,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 275,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 280,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 285,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 295,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 305,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 315,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 325,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 335,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-16",
      "tableName": "女生耐力跑单项评分表",
      "itemId": "run-800m",
      "grade": "初三",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-run-800m-高一-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高一",
    "gender": "female",
    "itemId": "run-800m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 204,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 210,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 216,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 223,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 230,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 235,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 240,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 245,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 250,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 255,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 260,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 265,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 270,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 275,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 280,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 290,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 300,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 310,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 320,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 330,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-16",
      "tableName": "女生耐力跑单项评分表",
      "itemId": "run-800m",
      "grade": "高一",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-run-800m-高二-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高二",
    "gender": "female",
    "itemId": "run-800m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 202,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 208,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 214,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 221,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 228,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 233,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 238,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 243,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 248,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 253,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 258,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 263,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 268,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 273,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 278,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 288,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 298,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 308,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 318,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 328,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-16",
      "tableName": "女生耐力跑单项评分表",
      "itemId": "run-800m",
      "grade": "高二",
      "gender": "female"
    },
    "verificationStatus": "verified"
  },
  {
    "id": "nf2014-run-800m-高三-female",
    "standardId": "cn-national-student-fitness-2014",
    "grade": "高三",
    "gender": "female",
    "itemId": "run-800m",
    "unit": "s",
    "unitLabel": "秒",
    "valueKind": "time",
    "ruleKind": "lowerBetter",
    "maxBaseScore": 100,
    "minBaseScore": 10,
    "rangeEntries": [],
    "thresholdEntries": [
      {
        "threshold": 200,
        "inclusive": true,
        "score": 100
      },
      {
        "threshold": 206,
        "inclusive": true,
        "score": 95
      },
      {
        "threshold": 212,
        "inclusive": true,
        "score": 90
      },
      {
        "threshold": 219,
        "inclusive": true,
        "score": 85
      },
      {
        "threshold": 226,
        "inclusive": true,
        "score": 80
      },
      {
        "threshold": 231,
        "inclusive": true,
        "score": 78
      },
      {
        "threshold": 236,
        "inclusive": true,
        "score": 76
      },
      {
        "threshold": 241,
        "inclusive": true,
        "score": 74
      },
      {
        "threshold": 246,
        "inclusive": true,
        "score": 72
      },
      {
        "threshold": 251,
        "inclusive": true,
        "score": 70
      },
      {
        "threshold": 256,
        "inclusive": true,
        "score": 68
      },
      {
        "threshold": 261,
        "inclusive": true,
        "score": 66
      },
      {
        "threshold": 266,
        "inclusive": true,
        "score": 64
      },
      {
        "threshold": 271,
        "inclusive": true,
        "score": 62
      },
      {
        "threshold": 276,
        "inclusive": true,
        "score": 60
      },
      {
        "threshold": 286,
        "inclusive": true,
        "score": 50
      },
      {
        "threshold": 296,
        "inclusive": true,
        "score": 40
      },
      {
        "threshold": 306,
        "inclusive": true,
        "score": 30
      },
      {
        "threshold": 316,
        "inclusive": true,
        "score": 20
      },
      {
        "threshold": 326,
        "inclusive": true,
        "score": 10
      }
    ],
    "bonusCategory": null,
    "source": {
      "standardName": "国家学生体质健康标准（2014年修订）",
      "version": "2014年修订",
      "authority": "教育部",
      "sourceDocument": "教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）",
      "documentNo": "教体艺〔2014〕5号",
      "tableNo": "表1-16",
      "tableName": "女生耐力跑单项评分表",
      "itemId": "run-800m",
      "grade": "高三",
      "gender": "female"
    },
    "verificationStatus": "verified"
  }
]
