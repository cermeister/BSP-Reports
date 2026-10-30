import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
  LayoutDashboard, ClipboardList, PlusCircle, FileText, Settings,
  Download, Upload, Printer, Search, Pencil, Trash2, Users, UserRound,
  School, PhilippinePeso, Menu, X
} from 'lucide-react';
import { supabase, getSupabaseConfig } from './lib/supabase';

const DEFAULT_DIVISIONS = [
  'Butuan City Division',
  'Cabadbaran City Division',
  'Agusan del Norte Division'
];
const SECTIONS = [
  ['kid', 'Kid Scouts'], ['kab', 'Kab Scouts'], ['boy', 'Boy Scouts'],
  ['senior', 'Senior Scouts'], ['rover', 'Rover Scouts']
];
const COLORS = ['#174a78', '#e4ad37', '#26936d', '#8a6bb1', '#df7954', '#4b9eae', '#8796a8'];
const STORAGE_KEY = 'bspAgusanReact';
const EMPTY = { divisions: DEFAULT_DIVISIONS, districts: {}, records: [] };
const today = () => new Date().toISOString().slice(0, 10);
const money = n => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n || 0));
const fmt = n => new Intl.NumberFormat('en-PH').format(Number(n || 0));
const scoutsOf = r => SECTIONS.reduce((sum, [key]) => sum + Number(r[key] || 0), 0);
const totalsOf = records => records.reduce((a, r) => {
  SECTIONS.forEach(([key]) => a[key] += Number(r[key] || 0));
  a.scouts += scoutsOf(r); a.leaders += Number(r.leaders || 0);
  a.entries += 1; a.paid += Number(r.paid || 0); a.male += Number(r.male || 0);
  a.female += Number(r.female || 0);
  return a;
}, { scouts: 0, leaders: 0, entries: 0, paid: 0, male: 0, female: 0, kid: 0, kab: 0, boy: 0, senior: 0, rover: 0 });
const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...EMPTY, ...saved };
  } catch {
    return EMPTY;
  }
};

function Metric({ label, value, note, icon: Icon }) {
  return <article className="metric"><div className="metric-top"><span>{label}</span><Icon size={18}/></div><strong>{value}</strong><small>{note}</small></article>;
}
function Panel({ title, subtitle, children, className = '' }) {
  return <section className={`panel ${className}`}><div className="panel-heading"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div></div>{children}</section>;
}
function EmptyChart() { return <div className="empty-chart">No data available yet. Add registration records to generate this chart.</div>; }

export default function App() {
  const [db, setDb] = useState(load);
  const [page, setPage] = useState('dashboard');
  const [selectedDivision, setSelectedDivision] = useState(DEFAULT_DIVISIONS[0]);
  const [year, setYear] = useState('all');
  const [query, setQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState(getSupabaseConfig());
  const [form, setForm] = useState({
    division: DEFAULT_DIVISIONS[0], district: '', school: '', date: today(),
    receipt: '', aur: '', kid: 0, kab: 0, boy: 0, senior: 0, rover: 0,
    male: 0, female: 0, leaders: 0, heads: 0, scoutFee: 0, leaderFee: 0,
    paid: 0, paymentNotes: ''
  });

  useEffect(() => {
    if (!supabase) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      setConnectionInfo(getSupabaseConfig());
      return;
    }

    let isMounted = true;

    const loadRemote = async () => {
      const { data, error } = await supabase.from('bsp_app_state').select('payload').eq('id', 'app-data').maybeSingle();
      if (!isMounted) return;

      if (error) {
        console.warn('Supabase load failed:', error.message);
        setConnectionInfo({ ...getSupabaseConfig(), connected: false, error: error.message });
        return;
      }

      if (data?.payload && Array.isArray(data.payload.records)) {
        setDb({ ...EMPTY, ...data.payload });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.payload));
      }
    };

    loadRemote();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (supabase) {
      supabase.from('bsp_app_state').upsert({ id: 'app-data', payload: db }, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) {
            console.warn('Supabase save failed:', error.message);
            setConnectionInfo({ ...getSupabaseConfig(), connected: false, error: error.message });
          } else {
            setConnectionInfo(getSupabaseConfig());
          }
        })
        .catch((error) => {
          console.warn('Supabase save error:', error);
          setConnectionInfo({ ...getSupabaseConfig(), connected: false, error: error.message });
        });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }, [db]);

  const records = db.records || [];
  const yearOptions = [...new Set([new Date().getFullYear(), ...records.map(r => Number((r.date || '').slice(0, 4))).filter(Boolean)])].sort((a,b) => b-a);
  const dashboardRecords = records.filter(r => year === 'all' || (r.date || '').startsWith(year));
  const totals = totalsOf(dashboardRecords);
  const scoutByDivision = db.divisions.map(name => ({
    name: name.replace(' Division', ''),
    value: dashboardRecords.filter(r => r.division === name).reduce((s, r) => s + scoutsOf(r), 0)
  }));
  const leadersByDivision = db.divisions.map(name => ({
    name: name.replace(' Division', ''),
    value: dashboardRecords.filter(r => r.division === name).reduce((s, r) => s + Number(r.leaders || 0), 0)
  }));
  const sectionData = SECTIONS.map(([key, label]) => ({ name: label, total: totals[key] }));
  const trendData = useMemo(() => monthlyData(dashboardRecords, 'scouts'), [dashboardRecords]);
  const revenueData = useMemo(() => monthlyData(dashboardRecords, 'paid'), [dashboardRecords]);
  const districtNames = [...new Set([
    ...(db.districts[selectedDivision] || []),
    ...dashboardRecords.filter(r => r.division === selectedDivision).map(r => r.district).filter(Boolean)
  ])];
  const districtScouts = districtNames.map(name => ({
    name, value: dashboardRecords.filter(r => r.division === selectedDivision && r.district === name).reduce((s,r) => s + scoutsOf(r), 0)
  }));
  const districtLeaders = districtNames.map(name => ({
    name, value: dashboardRecords.filter(r => r.division === selectedDivision && r.district === name).reduce((s,r) => s + Number(r.leaders || 0), 0)
  }));

  function setField(key, value) { setForm(prev => ({ ...prev, [key]: value })); }
  const formScouts = scoutsOf(form);
  const expected = formScouts * Number(form.scoutFee || 0) + Number(form.leaders || 0) * Number(form.leaderFee || 0);

  function resetForm() {
    setEditingId(null);
    setForm({ division: db.divisions[0] || '', district: '', school: '', date: today(), receipt: '', aur: '',
      kid: 0, kab: 0, boy: 0, senior: 0, rover: 0, male: 0, female: 0, leaders: 0, heads: 0,
      scoutFee: 0, leaderFee: 0, paid: 0, paymentNotes: '' });
  }
  function saveRecord(e) {
    e.preventDefault();
    const record = { ...form, id: editingId || crypto.randomUUID(), expected };
    if (Number(form.male) + Number(form.female) !== formScouts &&
      !window.confirm('Male + Female count does not equal total scouts. Save anyway?')) return;
    setDb(prev => {
      const exists = prev.records.some(r => r.id === record.id);
      const nextRecords = exists ? prev.records.map(r => r.id === record.id ? record : r) : [...prev.records, record];
      const districts = { ...prev.districts, [record.division]: [...new Set([...(prev.districts[record.division] || []), record.district].filter(Boolean))] };
      return { ...prev, records: nextRecords, districts };
    });
    resetForm(); setPage('registrations');
  }
  function editRecord(r) {
    setForm({ ...r }); setEditingId(r.id); setPage('form');
  }
  function deleteRecord(id) {
    if (window.confirm('Delete this registration record?')) setDb(prev => ({ ...prev, records: prev.records.filter(r => r.id !== id) }));
  }
  function addDivision() {
    const value = window.prompt('Enter the new division name:')?.trim();
    if (!value) return;
    if (db.divisions.some(d => d.toLowerCase() === value.toLowerCase())) return window.alert('Division already exists.');
    setDb(prev => ({ ...prev, divisions: [...prev.divisions, value], districts: { ...prev.districts, [value]: [] } }));
  }
  function addDistrict() {
    const division = window.prompt('Enter the division name exactly as listed:\n' + db.divisions.join('\n'))?.trim();
    if (!division || !db.divisions.includes(division)) return window.alert('Please enter an existing division name.');
    const district = window.prompt(`Enter a district under ${division}:`)?.trim();
    if (!district) return;
    setDb(prev => ({ ...prev, districts: { ...prev.districts, [division]: [...new Set([...(prev.districts[division] || []), district])] } }));
  }
  function backup() {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    download(blob, `BSP-Agusan-Backup-${today()}.json`);
  }
  function importBackup(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.divisions) || !Array.isArray(data.records)) throw new Error();
        if (window.confirm('Import backup and replace current browser data?')) setDb({ ...EMPTY, ...data });
      } catch { window.alert('Invalid backup file.'); }
      e.target.value = '';
    };
    reader.readAsText(file);
  }
  function exportCsv() {
    const cols = ['date','division','district','school','kid','kab','boy','senior','rover','male','female','leaders','heads','receipt','aur','scoutFee','leaderFee','expected','paid','paymentNotes'];
    const csv = [cols.join(','), ...records.map(r => cols.map(k => `"${String(r[k] ?? '').replaceAll('"','""')}"`).join(','))].join('\n');
    download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'BSP-Agusan-Registrations.csv');
  }
  function download(blob, filename) {
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }
  function printPage() { window.print(); }

  const filteredRecords = records.filter(r =>
    (!divisionFilter || r.division === divisionFilter) &&
    [r.school, r.district, r.receipt, r.aur, r.division].join(' ').toLowerCase().includes(query.toLowerCase())
  ).sort((a,b) => (b.date || '').localeCompare(a.date || ''));

  const navItems = [
    ['dashboard', 'Dashboard', LayoutDashboard],
    ['registrations', 'Registrations', ClipboardList],
    ['form', 'Add Registration', PlusCircle],
    ['reports', 'Reports', FileText],
    ['settings', 'Divisions & Districts', Settings]
  ];
  function navigate(id) { setPage(id); setMobileNav(false); }

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">BSP</div><div><b>AGUSAN COUNCIL</b><span>Registration Analytics & Reporting System</span></div></div>
      <div className="top-actions">
        <span className={`connection-pill ${connectionInfo.connected ? 'online' : 'offline'}`}>
          {connectionInfo.connected ? 'Supabase connected' : 'Local storage mode'}
        </span>
        <button className="btn light" onClick={backup}><Download size={16}/> Backup</button>
        <label className="btn light file-button"><Upload size={16}/> Import<input type="file" accept=".json" onChange={importBackup}/></label>
        <button className="btn gold" onClick={printPage}><Printer size={16}/> Print</button>
        <button className="icon-button mobile-toggle" onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X/> : <Menu/>}</button>
      </div>
    </header>
    <div className="app-layout">
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="side-label">WORKSPACE</div>
        {navItems.map(([id, label, Icon]) => <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => navigate(id)}><Icon size={18}/>{label}</button>)}
        <div className="sidebar-note"><b>BSP Agusan Council</b><span>Registration data workspace</span></div>
      </aside>
      <main className="content">
        {page === 'dashboard' && <section className="page">
          <div className="page-heading"><div><h1>Council Overview</h1><p>Registration performance, membership distribution, and collections.</p></div><select className="control year-select" value={year} onChange={e => setYear(e.target.value)}><option value="all">All years</option>{yearOptions.map(y => <option key={y}>{y}</option>)}</select></div>
          <div className="metric-grid">
            <Metric label="Total Registered Scouts" value={fmt(totals.scouts)} note="Across selected period" icon={Users}/>
            <Metric label="Unit Leaders" value={fmt(totals.leaders)} note="Registered leaders" icon={UserRound}/>
            <Metric label="School Registrations" value={fmt(totals.entries)} note="Encoded submissions" icon={School}/>
            <Metric label="Total Collections" value={money(totals.paid)} note="Actual recorded payments" icon={PhilippinePeso}/>
          </div>
          <div className="two-col">
            <Panel title="Scouts by Division" subtitle="Share of registered scouts"><ChartPie data={scoutByDivision}/></Panel>
            <Panel title="Unit Leaders by Division" subtitle="Share of registered Unit Leaders"><ChartPie data={leadersByDivision}/></Panel>
          </div>
          <Panel title="Scout Registration Breakdown" subtitle="Council-wide totals by section"><div className="chart-box tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={sectionData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis allowDecimals={false}/><Tooltip formatter={v => fmt(v)}/><Bar dataKey="total" fill="#174a78" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></Panel>
          <div className="two-col">
            <Panel title="Registration Trend" subtitle="Scouts registered per month"><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month" tick={{fontSize:10}}/><YAxis allowDecimals={false}/><Tooltip/><Line type="monotone" dataKey="scouts" stroke="#174a78" strokeWidth={3} dot={{fill:'#e4ad37',r:4}}/></LineChart></ResponsiveContainer></div></Panel>
            <Panel title="Monthly Collections" subtitle="Recorded payments by registration month"><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month" tick={{fontSize:10}}/><YAxis/><Tooltip formatter={v => money(v)}/><Bar dataKey="collections" fill="#26936d" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></Panel>
          </div>
          <Panel title="Division Drill-down" subtitle="Select a division to view district-level scout and leader distribution.">
            <div className="chip-row">{db.divisions.map(d => <button key={d} className={`chip ${selectedDivision === d ? 'selected' : ''}`} onClick={() => setSelectedDivision(d)}>{d}</button>)}</div>
            <div className="two-col drill-charts"><Panel title={`${selectedDivision} — Scouts by District`}><ChartPie data={districtScouts}/></Panel><Panel title={`${selectedDivision} — Unit Leaders by District`}><ChartPie data={districtLeaders}/></Panel></div>
          </Panel>
        </section>}

        {page === 'form' && <section className="page">
          <div className="page-heading"><div><h1>{editingId ? 'Edit Registration' : 'Add Registration'}</h1><p>Encode one school's registration submission.</p></div></div>
          <form className="form-panel" onSubmit={saveRecord}>
            <FormSection title="1. Registration Information">
              <Field label="Division *"><select required value={form.division} onChange={e => setField('division',e.target.value)}>{db.divisions.map(d => <option key={d}>{d}</option>)}</select></Field>
              <Field label="District *"><input required list="district-list" value={form.district} onChange={e => setField('district',e.target.value)} placeholder="Enter or select district"/><datalist id="district-list">{(db.districts[form.division] || []).map(d => <option key={d} value={d}/>)}</datalist></Field>
              <Field label="School / Institution *"><input required value={form.school} onChange={e => setField('school',e.target.value)} placeholder="School name"/></Field>
              <Field label="Registration Date *"><input required type="date" value={form.date} onChange={e => setField('date',e.target.value)}/></Field>
              <Field label="Invoice Number / Receipt No. *"><input required value={form.receipt} onChange={e => setField('receipt',e.target.value)} placeholder="e.g. OR-000123"/></Field>
              <Field label="AUR Number (Optional)"><input value={form.aur} onChange={e => setField('aur',e.target.value)} placeholder="Enter AUR number"/></Field>
            </FormSection>
            <FormSection title="2. Scout Registration">
              {SECTIONS.map(([key,label]) => <Field key={key} label={label}><input type="number" min="0" value={form[key]} onChange={e => setField(key,e.target.value)}/></Field>)}
              <Field label="Total Scouts"><input readOnly value={fmt(formScouts)}/></Field>
              <Field label="Male Scouts (all sections)"><input type="number" min="0" value={form.male} onChange={e => setField('male',e.target.value)}/></Field>
              <Field label="Female Scouts (all sections)"><input type="number" min="0" value={form.female} onChange={e => setField('female',e.target.value)}/></Field>
              <Field label="Gender Count Check"><input readOnly value={Number(form.male)+Number(form.female) === formScouts ? 'Matched' : `Difference: ${Math.abs(formScouts-Number(form.male)-Number(form.female))}`}/></Field>
            </FormSection>
            <FormSection title="3. Unit Leaders">
              <Field label="Number of Unit Leaders"><input type="number" min="0" value={form.leaders} onChange={e => setField('leaders',e.target.value)}/></Field>
              <Field label="Institutional Heads (included in leader count)"><input type="number" min="0" value={form.heads} onChange={e => setField('heads',e.target.value)}/></Field>
            </FormSection>
            <FormSection title="4. Fees and Payment">
              <Field label="Fee per Scout (₱)"><input type="number" min="0" step="0.01" value={form.scoutFee} onChange={e => setField('scoutFee',e.target.value)}/></Field>
              <Field label="Fee per Unit Leader / Institutional Head (₱)"><input type="number" min="0" step="0.01" value={form.leaderFee} onChange={e => setField('leaderFee',e.target.value)}/></Field>
              <Field label="Calculated Expected Amount (₱)"><input readOnly value={money(expected)}/></Field>
              <Field label="Actual Amount Paid (₱) *"><input required type="number" min="0" step="0.01" value={form.paid} onChange={e => setField('paid',e.target.value)}/></Field>
              <Field label="Payment Notes"><input value={form.paymentNotes} onChange={e => setField('paymentNotes',e.target.value)} placeholder="Optional notes"/></Field>
            </FormSection>
            <p className="form-hint">Expected amount = (total scouts × fee per scout) + (Unit Leaders × leader fee). Actual amount paid is stored separately for partial payments or adjustments.</p>
            <div className="form-actions"><button className="btn gold" type="submit">Save Registration</button><button className="btn outline" type="button" onClick={() => {resetForm();setPage('registrations')}}>Cancel</button></div>
          </form>
        </section>}

        {page === 'registrations' && <section className="page">
          <div className="page-heading"><div><h1>Registration Records</h1><p>Search, edit, and manage encoded school registrations.</p></div><button className="btn gold" onClick={() => {resetForm();setPage('form')}}><PlusCircle size={16}/> Add Registration</button></div>
          <div className="toolbar"><div className="search-box"><Search size={16}/><input placeholder="Search school, district, receipt..." value={query} onChange={e => setQuery(e.target.value)}/></div><select className="control" value={divisionFilter} onChange={e => setDivisionFilter(e.target.value)}><option value="">All divisions</option>{db.divisions.map(d => <option key={d}>{d}</option>)}</select><button className="btn outline" onClick={exportCsv}><Download size={15}/> Export CSV</button></div>
          <div className="table-wrap"><table><thead><tr><th>Date</th><th>Division</th><th>District</th><th>School</th><th>Scouts</th><th>Leaders</th><th>Receipt / Invoice</th><th>Paid</th><th className="no-print">Actions</th></tr></thead><tbody>
            {filteredRecords.length ? filteredRecords.map(r => <tr key={r.id}><td>{r.date}</td><td>{r.division}</td><td>{r.district}</td><td><b>{r.school}</b></td><td>{fmt(scoutsOf(r))}</td><td>{fmt(r.leaders)}</td><td>{r.receipt}</td><td>{money(r.paid)}</td><td className="actions-cell no-print"><button className="table-action" onClick={() => editRecord(r)} aria-label="Edit"><Pencil size={15}/></button><button className="table-action delete" onClick={() => deleteRecord(r.id)} aria-label="Delete"><Trash2 size={15}/></button></td></tr>) : <tr><td colSpan="9" className="empty-row">No registration records found.</td></tr>}
          </tbody></table></div>
        </section>}

        {page === 'reports' && <section className="page">
          <div className="page-heading"><div><h1>Reports & Print Center</h1><p>Printable council registration and collection summaries.</p></div><button className="btn gold" onClick={printPage}><Printer size={16}/> Print Report</button></div>
          <div className="notice">Reports are generated from records saved in this browser. Use Backup regularly to protect your data.</div>
          <div className="metric-grid"><Metric label="Total Scouts" value={fmt(totalsOf(records).scouts)} note="All encoded years" icon={Users}/><Metric label="Unit Leaders" value={fmt(totalsOf(records).leaders)} note="All divisions" icon={UserRound}/><Metric label="Registrations" value={fmt(records.length)} note="School submissions" icon={School}/><Metric label="Collections" value={money(totalsOf(records).paid)} note="Actual recorded payments" icon={PhilippinePeso}/></div>
          <div className="two-col"><Panel title="Scouts by Division"><ChartPie data={scoutByDivision}/></Panel><Panel title="Unit Leaders by Division"><ChartPie data={leadersByDivision}/></Panel></div>
          <Panel title="Scout Section Summary"><div className="table-wrap"><table><thead><tr><th>Scout Section</th><th>Total Registered</th></tr></thead><tbody>{SECTIONS.map(([k,label]) => <tr key={k}><td>{label}</td><td>{fmt(totalsOf(records)[k])}</td></tr>)}<tr><th>Total Scouts</th><th>{fmt(totalsOf(records).scouts)}</th></tr></tbody></table></div></Panel>
          <Panel title="Division Summary"><DivisionSummary divisions={db.divisions} records={records}/></Panel>
        </section>}

        {page === 'settings' && <section className="page">
          <div className="page-heading"><div><h1>Divisions & Districts</h1><p>Manage organizational categories used in registration forms.</p></div></div>
          <div className="two-col"><Panel title="Add Division" subtitle="Create an additional division."><button className="btn gold" onClick={addDivision}><PlusCircle size={16}/> Add Division</button></Panel><Panel title="Add District" subtitle="Add a district under a selected division."><button className="btn gold" onClick={addDistrict}><PlusCircle size={16}/> Add District</button></Panel></div>
          <Panel title="Current Divisions and Districts">{db.divisions.map(d => <div className="division-row" key={d}><b>{d}</b><span>{(db.districts[d] || []).length ? db.districts[d].join(' · ') : 'No districts added yet'}</span></div>)}</Panel>
        </section>}
        <footer className="footer">BSP Agusan Council · Registration Analytics System <span>Prototype v1.0</span></footer>
      </main>
    </div>
  </div>;
}

function monthlyData(records, field) {
  const map = {};
  records.forEach(r => {
    if (!r.date) return;
    const key = r.date.slice(0,7); map[key] ||= 0;
    map[key] += field === 'scouts' ? scoutsOf(r) : Number(r[field] || 0);
  });
  return Object.entries(map).sort(([a],[b]) => a.localeCompare(b)).map(([key,value]) => ({
    month: new Date(`${key}-02`).toLocaleDateString('en-PH',{month:'short',year:'2-digit'}),
    [field === 'scouts' ? 'scouts' : 'collections']: value
  }));
}
function ChartPie({ data }) {
  const hasData = data.some(x => x.value > 0);
  if (!hasData) return <EmptyChart/>;
  return <div className="pie-layout"><div className="pie-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.filter(x => x.value > 0)} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88} paddingAngle={2}>{data.filter(x => x.value > 0).map((x,i) => <Cell key={x.name} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip formatter={v => fmt(v)}/></PieChart></ResponsiveContainer></div><div className="pie-legend">{data.filter(x => x.value > 0).map((x,i) => <div key={x.name}><i style={{background:COLORS[i % COLORS.length]}}/><span>{x.name}</span><b>{fmt(x.value)}</b></div>)}</div></div>;
}
function FormSection({ title, children }) { return <div className="form-section"><h3>{title}</h3><div className="form-grid">{children}</div></div>; }
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function DivisionSummary({ divisions, records }) {
  return <div className="table-wrap"><table><thead><tr><th>Division</th><th>Entries</th><th>Kid</th><th>Kab</th><th>Boy</th><th>Senior</th><th>Rover</th><th>Total Scouts</th><th>Leaders</th><th>Collections</th></tr></thead><tbody>{divisions.map(d => {
    const rs = records.filter(r => r.division === d), t = totalsOf(rs);
    return <tr key={d}><td>{d}</td><td>{t.entries}</td>{SECTIONS.map(([k]) => <td key={k}>{fmt(t[k])}</td>)}<td><b>{fmt(t.scouts)}</b></td><td>{fmt(t.leaders)}</td><td>{money(t.paid)}</td></tr>;
  })}</tbody></table></div>;
}
