from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

BASE = Path(__file__).resolve().parent
DATA = BASE / "data" / "electricity_bill_dataset.csv"
MODEL = BASE / "electricity_bill_model.pkl"
FEATURES = ["Fan","Refrigerator","AirConditioner","Television","Monitor","MotorPump","Month","City","Company","MonthlyHours","TariffRate"]
APPLIANCES = ["Fan","Refrigerator","AirConditioner","Television","Monitor","MotorPump"]
NUMERIC = APPLIANCES + ["Month","MonthlyHours","TariffRate","EstimatedUnits"]
CATEGORICAL = ["City","Company"]

POWER_KW = {"Fan":0.075,"Refrigerator":0.150,"AirConditioner":1.5,"Television":0.1,"Monitor":0.05,"MotorPump":0.75}
USAGE_FACTOR = {"Fan":1.0,"Refrigerator":0.7,"AirConditioner":0.65,"Television":1.0,"Monitor":1.0,"MotorPump":0.4}

def add_estimated_units(frame):
    result = frame.copy()
    weighted_kw = sum(result[a].astype(float) * POWER_KW[a] * USAGE_FACTOR[a] for a in APPLIANCES)
    result["EstimatedUnits"] = weighted_kw * result["MonthlyHours"].astype(float)
    return result

def train():
    data = pd.read_csv(DATA)
    X = add_estimated_units(data[FEATURES])
    y = data["ElectricityBill"]
    prep = ColumnTransformer([
        ("numbers","passthrough",NUMERIC),
        ("categories",OneHotEncoder(handle_unknown="ignore"),CATEGORICAL)
    ])
    pipeline = Pipeline([
        ("prep",prep),
        ("model",RandomForestRegressor(n_estimators=250,random_state=42,n_jobs=-1))
    ])
    x_train,x_test,y_train,y_test = train_test_split(X,y,test_size=.2,random_state=42)
    pipeline.fit(x_train,y_train)
    pred = pipeline.predict(x_test)
    scores = {"r2_score":float(r2_score(y_test,pred)),
              "mae":float(mean_absolute_error(y_test,pred)),
              "rmse":float(np.sqrt(mean_squared_error(y_test,pred)))}
    joblib.dump(pipeline,MODEL)
    return pipeline,scores,data

model, scores, dataset = train()
app = Flask(__name__)
CORS(app)

@app.get("/")
def home():
    return jsonify({"message":"Electricity Bill Prediction API is running","model":"Random Forest Regression"})

@app.get("/api/info")
def info():
    return jsonify({"model":"Random Forest Regression","rows":len(dataset),
        "r2_score":round(scores["r2_score"],4),"mae":round(scores["mae"],2),
        "rmse":round(scores["rmse"],2),
        "cities":sorted(dataset.City.unique().tolist()),
        "companies":sorted(dataset.Company.unique().tolist())})

@app.post("/api/predict")
def predict():
    try:
        body = request.get_json()
        if not body:
            return jsonify({"error":"Please provide input values."}),400
        row = {}
        for col in FEATURES:
            if col not in body or body[col] in (None,""):
                return jsonify({"error":f"{col} is required."}),400
            row[col] = str(body[col]).strip() if col in CATEGORICAL else float(body[col])
        if not 1 <= row["Month"] <= 12:
            return jsonify({"error":"Month must be between 1 and 12."}),400
        if any(row[c] < 0 for c in APPLIANCES + ["MonthlyHours","TariffRate"]):
            return jsonify({"error":"Appliance counts, hours and tariff cannot be negative."}),400
        if any(row[c] != int(row[c]) for c in APPLIANCES + ["Month"]):
            return jsonify({"error":"Appliance counts and month must be whole numbers."}),400
        x = add_estimated_units(pd.DataFrame([row],columns=FEATURES))
        prediction = float(model.predict(x)[0])
        units = float(x.iloc[0]["EstimatedUnits"])
        return jsonify({"predicted_bill":round(max(0,prediction),2),
                        "estimated_units":round(units,2),
                        "formula_estimate":round(units*row["TariffRate"],2),
                        "currency":"INR"})
    except (ValueError,TypeError) as exc:
        return jsonify({"error":f"Invalid input: {exc}"}),400
    except Exception as exc:
        return jsonify({"error":str(exc)}),500

if __name__ == "__main__":
    app.run(host="0.0.0.0",port=5000,debug=True)
