from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import joblib, io
from tensorflow import keras

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

COLUMNS = [
    'unit_id', 'time_cycle',
    'op_setting_1', 'op_setting_2', 'op_setting_3',
    *[f'sensor_{i:02d}' for i in range(1, 22)]
]

SENSORS_TO_KEEP = [
    'sensor_02','sensor_03','sensor_04','sensor_07',
    'sensor_08','sensor_09','sensor_11','sensor_12',
    'sensor_13','sensor_14','sensor_15','sensor_17',
    'sensor_20','sensor_21'
]

SETTING_COLS  = ['op_setting_1', 'op_setting_2', 'op_setting_3']
FEATURE_COLS  = SENSORS_TO_KEEP + SETTING_COLS
WINDOW_SIZE   = 30
RUL_CAP       = 125

print("Chargement du modèle...")
model = keras.models.load_model("cnn_lstm_combined_best.keras")

scalers = {
    'FD001': joblib.load('scalers_fd001.pkl'),
    'FD002': joblib.load('scalers_fd002.pkl'),
    'FD003': joblib.load('scalers_fd003.pkl'),
    'FD004': joblib.load('scalers_fd004.pkl'),
}
kmeans = {
    'FD002': joblib.load('kmeans_fd002.pkl'),
    'FD004': joblib.load('kmeans_fd004.pkl'),
}
print("✅ Modèle et scalers chargés")


def detect_dataset(df):
    op_var = df[SETTING_COLS].var().sum()
    return 'FD001' if op_var < 0.01 else 'FD002'


def preprocess(df, dataset):
    df = df.copy()
    sc = scalers[dataset]

    if dataset in ['FD001', 'FD003']:
        df[SENSORS_TO_KEEP] = sc[0].transform(df[SENSORS_TO_KEEP])
    else:
        km = kmeans[dataset]
        df['condition'] = km.predict(df[SETTING_COLS])
        for cond in df['condition'].unique():
            mask = df['condition'] == cond
            if cond in sc:
                df.loc[mask, SENSORS_TO_KEEP] = sc[cond].transform(
                    df.loc[mask, SENSORS_TO_KEEP]
                )
        df = df.drop(columns=['condition'])

    for col in SETTING_COLS:
        mn, mx = df[col].min(), df[col].max()
        df[col] = (df[col] - mn) / (mx - mn) if mx - mn > 0 else 0.0

    return df


def make_windows(df):
    results = []
    for uid, group in df.groupby('unit_id'):
        group = group.sort_values('time_cycle')
        data  = group[FEATURE_COLS].values
        T     = len(data)
        if T >= WINDOW_SIZE:
            window = data[-WINDOW_SIZE:]
        else:
            pad    = np.repeat(data[[0]], WINDOW_SIZE - T, axis=0)
            window = np.vstack([pad, data])
        results.append({
            'unit_id':  int(uid),
            'window':   window,
            'n_cycles': T
        })
    return results


def get_sensor_history(df_raw, unit_id):
    """Retourne l'historique des capteurs clés pour un moteur."""
    group = df_raw[df_raw['unit_id'] == unit_id].sort_values('time_cycle')
    key_sensors = ['sensor_02','sensor_03','sensor_04','sensor_07','sensor_11','sensor_12']
    history = {'time_cycle': group['time_cycle'].tolist()}
    for s in key_sensors:
        if s in group.columns:
            history[s] = group[s].tolist()
    return history


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        content      = await file.read()
        df_raw       = pd.read_csv(
            io.StringIO(content.decode()),
            sep=r'\s+', header=None, names=COLUMNS
        )
        dataset      = detect_dataset(df_raw)
        df_processed = preprocess(df_raw, dataset)
        units        = make_windows(df_processed)

        X     = np.array([u['window'] for u in units])
        preds = model.predict(X, verbose=0).flatten()
        preds = np.clip(preds, 0, RUL_CAP)

        results = []
        for i, unit in enumerate(units):
            rul    = float(round(preds[i]))
            status = 'healthy' if rul > 50 else 'warning' if rul > 20 else 'critical'
            results.append({
                'unit_id':       unit['unit_id'],
                'rul':           rul,
                'status':        status,
                'n_cycles':      unit['n_cycles'],
                'sensor_history': get_sensor_history(df_raw, unit['unit_id'])
            })

        results.sort(key=lambda x: x['rul'])

        return {
            'dataset':  dataset,
            'total':    len(results),
            'critical': sum(1 for r in results if r['status'] == 'critical'),
            'warning':  sum(1 for r in results if r['status'] == 'warning'),
            'healthy':  sum(1 for r in results if r['status'] == 'healthy'),
            'engines':  results
        }

    except Exception as e:
        return {'error': str(e)}


@app.get("/health")
def health():
    return {"status": "ok", "model": "cnn_lstm_combined"}