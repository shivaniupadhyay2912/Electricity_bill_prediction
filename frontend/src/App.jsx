import {useEffect,useState} from 'react';
import {Zap,Calculator,RotateCcw,Gauge,Info} from 'lucide-react';
const API='http://127.0.0.1:5000';
const initial={Fan:5,Refrigerator:1,AirConditioner:1,Television:1,Monitor:1,MotorPump:0,Month:10,City:'New Delhi',Company:'Tata Power Company Ltd.',MonthlyHours:300,TariffRate:8};
const appliances=[['Fan','Fans'],['Refrigerator','Refrigerators'],['AirConditioner','Air conditioners'],['Television','Televisions'],['Monitor','Monitors'],['MotorPump','Motor pumps']];
export default function App(){
 const [form,setForm]=useState(initial),[info,setInfo]=useState(null),[result,setResult]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 useEffect(()=>{fetch(`${API}/api/info`).then(r=>r.json()).then(setInfo).catch(()=>setError('Cannot connect to backend. Start Flask first.'));},[]);
 const update=(k,v)=>setForm(p=>({...p,[k]:v}));
 const predict=async e=>{e.preventDefault();setLoading(true);setError('');setResult(null);try{const r=await fetch(`${API}/api/predict`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const d=await r.json();if(!r.ok)throw Error(d.error||'Prediction failed');setResult(d);}catch(e){setError(e.message);}finally{setLoading(false);}};
 const reset=()=>{setForm(initial);setResult(null);setError('');};
 return <main className="page">
  <header><div className="brand"><span><Zap/></span> WattWise</div><small>MACHINE LEARNING PROJECT</small></header>
  <section className="hero"><label>● SMART ENERGY ESTIMATOR</label><h1>Electricity Bill <em>Prediction</em></h1><p>Change appliance quantities and usage details to estimate your monthly electricity bill.</p>
   <div className="stats"><div><b>{info?info.rows.toLocaleString('en-IN'):'—'}</b><small>Training records</small></div><div><b>Random Forest</b><small>ML algorithm</small></div><div><b>{info?`${(info.r2_score*100).toFixed(1)}%`:'—'}</b><small>Test R² score</small></div></div>
  </section>
  <section className="layout"><form className="panel" onSubmit={predict}>
   <div className="heading"><span><Calculator/></span><div><h2>Enter your details</h2><p>Update the values and predict again to see the difference.</p></div></div>
   <h3>01 <span>Appliance details</span></h3><div className="fields">
    {appliances.map(([key,label])=><label key={key}>{label}<input type="number" min="0" step="1" value={form[key]} onChange={e=>update(key,e.target.value)} required/></label>)}
   </div>
   <h3>02 <span>Billing information</span></h3><div className="fields">
    <label>Month<select value={form.Month} onChange={e=>update('Month',e.target.value)}>{Array.from({length:12},(_,i)=><option value={i+1} key={i}>{new Date(2000,i).toLocaleString('en',{month:'long'})}</option>)}</select></label>
    <label>Monthly usage hours<input type="number" min="0" value={form.MonthlyHours} onChange={e=>update('MonthlyHours',e.target.value)} required/></label>
    <label>Tariff rate (₹/unit)<input type="number" min="0" step=".1" value={form.TariffRate} onChange={e=>update('TariffRate',e.target.value)} required/></label>
    <label>City<input list="cities" value={form.City} onChange={e=>update('City',e.target.value)} required/><datalist id="cities">{(info?.cities||[]).map(x=><option key={x} value={x}/>)}</datalist></label>
    <label className="wide">Electricity company<input list="companies" value={form.Company} onChange={e=>update('Company',e.target.value)} required/><datalist id="companies">{(info?.companies||[]).map(x=><option key={x} value={x}/>)}</datalist></label>
   </div>
   {error&&<div className="error">{error}</div>}
   <div className="actions"><button className="primary" disabled={loading}><Zap size={17}/>{loading?'Predicting...':'Predict electricity bill'}</button><button type="button" className="secondary" onClick={reset}><RotateCcw size={16}/>Reset</button></div>
  </form>
  <aside className="panel result"><div className="heading"><span><Gauge/></span><div><h2>Your prediction</h2><p>Estimated monthly electricity cost</p></div></div>
   {result?<><div className="amount">₹{result.predicted_bill.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}</div><p className="muted">Random Forest model prediction</p><div className="detail"><span>Estimated consumption</span><b>{result.estimated_units.toLocaleString('en-IN')} kWh</b></div><div className="detail"><span>Formula estimate</span><b>₹{result.formula_estimate.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}</b></div><div className="success">Prediction completed</div></>:<div className="empty"><Zap size={38}/><h3>Your result appears here</h3><p>Enter your appliance details and click Predict electricity bill.</p></div>}
   <div className="note"><Info size={17}/><p><b>About this model</b><br/>Random Forest Regression trained on 5,000 synthetic records. Appliance counts are included in the consumption calculation.</p></div>
  </aside></section><footer>WattWise · Electricity Bill Prediction · Academic Project</footer>
 </main>;
}
