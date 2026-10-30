# Electricity Bill Prediction — React + Flask + Machine Learning

## Dataset
This version contains **5,000 synthetic records**. The original dataset's bill was driven by MonthlyHours × TariffRate, so appliance count changes had little or no influence. This updated dataset creates `ElectricityBill` from appliance quantities, assumed power consumption, monthly hours and tariff.

## Assumptions for this assignment
`MonthlyHours` is treated as monthly operating hours applied to the appliances. Average power and usage factors are simplified educational assumptions:

| Appliance | Power | Usage factor |
|---|---:|---:|
| Fan | 75 W | 1.00 |
| Refrigerator | 150 W | 0.70 |
| Air conditioner | 1500 W | 0.65 |
| Television | 100 W | 1.00 |
| Monitor | 50 W | 1.00 |
| Motor pump | 750 W | 0.40 |

`Estimated kWh = MonthlyHours × sum(appliance count × power in kW × usage factor)`

`ElectricityBill = Estimated kWh × TariffRate`

These assumptions are illustrative, not actual measured consumption or official utility calculations.

## Run backend (Windows PowerShell)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```
The model trains automatically when Flask starts and saves `electricity_bill_model.pkl`. Keep the terminal running at `http://127.0.0.1:5000`.

## Run frontend (second terminal)
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL, normally `http://localhost:5173`.

## Model details
- Random Forest Regression
- 80% training / 20% testing
- OneHotEncoder for City and Company
- Engineered feature: EstimatedUnits
- Test metrics: R², MAE and RMSE

R² is a model evaluation metric, not a guaranteed accuracy percentage. This is a synthetic academic dataset; mention the assumptions in your report.
