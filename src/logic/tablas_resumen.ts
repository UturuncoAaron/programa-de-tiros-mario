// src/logic/tablas_resumen.ts

// Definimos una interfaz más flexible pero segura
export interface FilaResumen {
    dist: number;
    // Permitimos acceso por índice de cadena (c0, c1...)
    [key: string]: number | null;
}

// DATOS W87 (CHINA)
export const DATA_W87: FilaResumen[] = [
    { dist: 100, c0: 1511, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: null },
    { dist: 200, c0: 1422, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: null },
    { dist: 300, c0: 1324, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: null },
    { dist: 400, c0: 1215, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: null },
    { dist: 500, c0: 1072, c1: 1415, c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: null },
    { dist: 582, c0: 800, c1: 1382, c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: null },
    { dist: 600, c0: null, c1: 1375, c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: null },
    { dist: 700, c0: null, c1: 1333, c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: null },
    { dist: 800, c0: null, c1: 1289, c2: 1415, c3: null, c4: null, c5: null, c6: null, c7: null, c8: null },
    { dist: 900, c0: null, c1: 1242, c2: 1390, c3: null, c4: null, c5: null, c6: null, c7: null, c8: null },
    { dist: 1000, c0: null, c1: 1190, c2: 1365, c3: null, c4: null, c5: null, c6: null, c7: null, c8: null },
    { dist: 1100, c0: null, c1: 1131, c2: 1339, c3: 1410, c4: null, c5: null, c6: null, c7: null, c8: null },
    { dist: 1200, c0: null, c1: 1061, c2: 1311, c3: 1391, c4: null, c5: null, c6: null, c7: null, c8: null },
    { dist: 1300, c0: null, c1: 969, c2: 1283, c3: 1373, c4: 1412, c5: null, c6: null, c7: null, c8: null },
    { dist: 1374, c0: null, c1: 800, c2: 1262, c3: 1359, c4: 1400, c5: null, c6: null, c7: null, c8: null },
    { dist: 1400, c0: null, c1: null, c2: 1254, c3: 1354, c4: 1396, c5: null, c6: null, c7: null, c8: null },
    { dist: 1500, c0: null, c1: null, c2: 1223, c3: 1334, c4: 1380, c5: 1412, c6: null, c7: null, c8: null },
    { dist: 1600, c0: null, c1: null, c2: 1190, c3: 1314, c4: 1365, c5: 1399, c6: null, c7: null, c8: null },
    { dist: 1700, c0: null, c1: null, c2: 1155, c3: 1294, c4: 1349, c5: 1386, c6: 1414, c7: null, c8: null },
    { dist: 1800, c0: null, c1: null, c2: 1116, c3: 1272, c4: 1332, c5: 1372, c6: 1403, c7: null, c8: null },
    { dist: 1900, c0: null, c1: null, c2: 1073, c3: 1250, c4: 1316, c5: 1359, c6: 1391, c7: 1414, c8: null },
    { dist: 2000, c0: null, c1: null, c2: 1024, c3: 1226, c4: 1298, c5: 1345, c6: 1379, c7: 1404, c8: 1421 },
    { dist: 2100, c0: null, c1: null, c2: 961, c3: 1204, c4: 1281, c5: 1330, c6: 1367, c7: 1393, c8: 1412 },
    { dist: 2200, c0: null, c1: null, c2: 864, c3: 1179, c4: 1263, c5: 1316, c6: 1355, c7: 1383, c8: 1402 },
    { dist: 2228, c0: null, c1: null, c2: 800, c3: 1172, c4: 1258, c5: 1312, c6: 1352, c7: 1380, c8: 1399 },
    { dist: 2300, c0: null, c1: null, c2: null, c3: 1153, c4: 1244, c5: 1301, c6: 1343, c7: 1372, c8: 1392 },
    { dist: 2400, c0: null, c1: null, c2: null, c3: 1125, c4: 1225, c5: 1286, c6: 1331, c7: 1361, c8: 1383 },
    { dist: 2500, c0: null, c1: null, c2: null, c3: 1095, c4: 1206, c5: 1271, c6: 1318, c7: 1351, c8: 1373 },
    { dist: 2600, c0: null, c1: null, c2: null, c3: 1062, c4: 1185, c5: 1255, c6: 1305, c7: 1340, c8: 1363 },
    { dist: 2700, c0: null, c1: null, c2: null, c3: 1025, c4: 1163, c5: 1239, c6: 1292, c7: 1328, c8: 1353 },
    { dist: 2800, c0: null, c1: null, c2: null, c3: 983, c4: 1140, c5: 1222, c6: 1279, c7: 1317, c8: 1343 },
    { dist: 2900, c0: null, c1: null, c2: null, c3: 928, c4: 1116, c5: 1205, c6: 1265, c7: 1306, c8: 1333 },
    { dist: 3000, c0: null, c1: null, c2: null, c3: 841, c4: 1090, c5: 1187, c6: 1251, c7: 1294, c8: 1323 },
    { dist: 3018, c0: null, c1: null, c2: null, c3: 800, c4: 1085, c5: 1184, c6: 1248, c7: 1292, c8: 1321 },
    { dist: 3100, c0: null, c1: null, c2: null, c3: null, c4: 1063, c5: 1169, c6: 1237, c7: 1282, c8: 1312 },
    { dist: 3200, c0: null, c1: null, c2: null, c3: null, c4: 1032, c5: 1150, c6: 1223, c7: 1270, c8: 1301 },
    { dist: 3300, c0: null, c1: null, c2: null, c3: null, c4: 997, c5: 1129, c6: 1207, c7: 1257, c8: 1291 },
    { dist: 3400, c0: null, c1: null, c2: null, c3: null, c4: 956, c5: 1108, c6: 1192, c7: 1245, c8: 1280 },
    { dist: 3500, c0: null, c1: null, c2: null, c3: null, c4: 902, c5: 1085, c6: 1176, c7: 1232, c8: 1268 },
    { dist: 3594, c0: null, c1: null, c2: null, c3: null, c4: 800, c5: 1064, c6: 1160, c7: 1219, c8: 1258 },
    { dist: 3600, c0: null, c1: null, c2: null, c3: null, c4: null, c5: 1061, c6: 1159, c7: 1218, c8: 1257 },
    { dist: 3700, c0: null, c1: null, c2: null, c3: null, c4: null, c5: 1035, c6: 1142, c7: 1205, c8: 1245 },
    { dist: 3800, c0: null, c1: null, c2: null, c3: null, c4: null, c5: 1005, c6: 1124, c7: 1191, c8: 1233 },
    { dist: 3900, c0: null, c1: null, c2: null, c3: null, c4: null, c5: 972, c6: 1105, c7: 1176, c8: 1221 },
    { dist: 4000, c0: null, c1: null, c2: null, c3: null, c4: null, c5: 931, c6: 1085, c7: 1161, c8: 1209 },
    { dist: 4100, c0: null, c1: null, c2: null, c3: null, c4: null, c5: 875, c6: 1064, c7: 1145, c8: 1196 },
    { dist: 4165, c0: null, c1: null, c2: null, c3: null, c4: null, c5: 800, c6: 1049, c7: 1135, c8: 1188 },
    { dist: 4200, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: 1041, c7: 1129, c8: 1183 },
    { dist: 4300, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: 1017, c7: 1113, c8: 1169 },
    { dist: 4400, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: 989, c7: 1095, c8: 1155 },
    { dist: 4500, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: 957, c7: 1076, c8: 1140 },
    { dist: 4600, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: 919, c7: 1057, c8: 1125 },
    { dist: 4700, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: 864, c7: 1036, c8: 1109 },
    { dist: 4761, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: 800, c7: 1022, c8: 1099 },
    { dist: 4800, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: 1013, c8: 1092 },
    { dist: 4900, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: 987, c8: 1074 },
    { dist: 5000, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: 959, c8: 1055 },
    { dist: 5100, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: 924, c8: 1034 },
    { dist: 5200, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: 882, c8: 1012 },
    { dist: 5299, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: 800, c8: 988 },
    { dist: 5300, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: 988 },
    { dist: 5400, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: 959 },
    { dist: 5500, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: 923 },
    { dist: 5600, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: 874 },
    { dist: 5659, c0: null, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: 800 },
];

// DATOS USA (Ejemplo)
export const DATA_M43: FilaResumen[] = [
    { dist: 100, c0: 1400, c1: null, c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: null },
    { dist: 500, c0: 900, c1: 1300, c2: null, c3: null, c4: null, c5: null, c6: null, c7: null, c8: null },
    { dist: 1000, c0: null, c1: 1100, c2: 1250, c3: null, c4: null, c5: null, c6: null, c7: null, c8: null },
    { dist: 4000, c0: null, c1: null, c2: null, c3: null, c4: null, c5: 900, c6: 1100, c7: null, c8: null },
];

// EXPORTAMOS EL MAESTRO
export const TABLAS_MAESTRAS = {
    "W87": { nombre: "CHINA W87 (81mm)", datos: DATA_W87 },
    "M43": { nombre: "USA M43 (81mm)", datos: DATA_M43 }
};