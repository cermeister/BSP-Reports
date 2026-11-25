import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, LabelList
} from 'recharts';
import {
  LayoutDashboard, ClipboardList, PlusCircle, FileText, Settings,
  Download, Upload, Printer, Search, Pencil, Trash2, Users, UserRound,
  School, PhilippinePeso, Menu, X, ChevronLeft, ChevronRight
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
const LEADER_SECTIONS = [
  ['langkayLeader', 'Langkay Leader (Kid Scouts)'],
  ['kawanLeader', 'Kawan Leader (Kab Scouts)'],
  ['troopLeader', 'Troop Leader (Boy Scouts)'],
  ['outfitAdvisor', 'Outfit Advisor (Senior Scouts)'],
  ['circleManager', 'Circle Manager (Rover Scouts)']
];
const leaderSectionsOf = r => LEADER_SECTIONS.reduce((sum, [key]) => sum + Number(r[key] || 0), 0);
const COLORS = ['#174a78', '#e4ad37', '#26936d', '#8a6bb1', '#df7954', '#4b9eae', '#8796a8'];
const SECTION_COLORS = {
  'Kid Scouts': '#cfe7f6',
  'Kab Scouts': '#f5c94c',
  'Boy Scouts': '#2c9a6f',
  'Senior Scouts': '#d34b4b',
  'Rover Scouts': '#123a5a'
};
const SECTION_COLOR_LIST = ['#cfe7f6', '#f5c94c', '#2c9a6f', '#d34b4b', '#123a5a'];
const TRANSMITTAL_SECTIONS = [
  ['kid', 'KID', '#4da3e1', '#111111'],
  ['kab', 'KAB', '#fff200', '#111111'],
  ['boy', 'BOY', '#12a14b', '#111111'],
  ['senior', 'SENIOR', '#e61c1c', '#ffffff'],
  ['rover', 'ROVER', '#072b4f', '#ffffff']
];
const TRANSMITTAL_BASE_ROWS = [
  { key: 'agusan-del-norte', label: 'AGUSAN DEL NORTE', match: ['agusan del norte', 'agusan del norte division'] },
  { key: 'butuan-city', label: 'BUTUAN CITY', match: ['butuan city', 'butuan city division'] },
  { key: 'cabadbaran-city', label: 'CABADBARAN CITY', match: ['cabadbaran city', 'cabadbaran city division'] },
  { key: 'community-institution', label: 'COMMUNITY INSTITUTION', match: ['community institution', 'community institution division', 'community'] }
];
const TRANSMITTAL_SIGNATURE_KEY = 'bspAgusanTransmittalSignature';
const MMRR_PREPARED_SIG_KEY = 'bspAgusanMmrrPreparedSig';
const MMRR_CERTIFIED_SIG_KEY = 'bspAgusanMmrrCertifiedSig';
const MMRR_PREPARED_NAME_KEY = 'bspAgusanMmrrPreparedName';
const MMRR_CERTIFIED_NAME_KEY = 'bspAgusanMmrrCertifiedName';
const MMRR_SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MMRR_SECTIONS = [
  {
    id: 'scouts',
    title: 'SCOUTS',
    hasBlankRow: true,
    rows: [
      { key: 'kid', label: 'KID Scout', fee: 50, field: 'kid' },
      { key: 'kab', label: 'KAB Scout', fee: 50, field: 'kab' },
      { key: 'boy', label: 'Boy Scout', fee: 50, field: 'boy' },
      { key: 'senior', label: 'Senior Scout', fee: 50, field: 'senior' },
      { key: 'rover', label: 'Rover Scout', fee: 50, field: 'rover' }
    ]
  },
  {
    id: 'leaders',
    title: 'UNIT LEADERS',
    rows: [
      { key: 'langkayLeader', label: 'Langkay Leader/Assistant', fee: 60, field: 'langkayLeader' },
      { key: 'kawanLeader', label: 'Kawan Leader/Assistant', fee: 60, field: 'kawanLeader' },
      { key: 'troopLeader', label: 'Troop Leader/Assistant', fee: 60, field: 'troopLeader' },
      { key: 'outfitAdvisor', label: 'Outfit Advisor/Assistant', fee: 60, field: 'outfitAdvisor' },
      { key: 'circleManager', label: 'Circle Manager/Assistant', fee: 60, field: 'circleManager' }
    ]
  },
  {
    id: 'lay',
    title: 'LAY LEADERS',
    rows: [
      { key: 'isr', label: 'Institutional Scouting Representative', fee: 100, field: 'heads' },
      { key: 'iscom', label: 'ISCOM/ISC', fee: 100 },
      { key: 'distComm', label: 'Dist./Mun. Commissioner/Coor.', fee: 100 },
      { key: 'distChair', label: 'Dist./Mun. Chairperson', fee: 100 },
      { key: 'dmal', label: 'DMAL/CMAL', fee: 100 },
      { key: 'councilStaff', label: 'Local Council Staff', fee: 100 }
    ]
  }
];
const MMRR_UNITS = [
  { key: 'langkay', label: 'Langkay', scoutField: 'kid', leaderField: 'langkayLeader' },
  { key: 'kawan', label: 'Kawan', scoutField: 'kab', leaderField: 'kawanLeader' },
  { key: 'troop', label: 'Troop', scoutField: 'boy', leaderField: 'troopLeader' },
  { key: 'outfit', label: 'Outfit', scoutField: 'senior', leaderField: 'outfitAdvisor' },
  { key: 'circle', label: 'Circle', scoutField: 'rover', leaderField: 'circleManager' }
];
const STORAGE_KEY = 'bspAgusanReact';
const AUTH_STORAGE_KEY = 'bspAgusanAuth_v2';
const CURRENT_AUTH_SESSION_VERSION = 2;
const EMPTY = { divisions: DEFAULT_DIVISIONS, districts: {}, schools: {}, records: [] };
const DEFAULT_ACCOUNT_PASSWORD = 'Caciahmarie!2026';
const VIEWER_ACCOUNT_PASSWORD = 'Viewer!2026';
const AUTH_USERS = {
  'christian@bspagusancouncil.com': { email: 'christian@bspagusancouncil.com', role: 'admin', password: DEFAULT_ACCOUNT_PASSWORD },
  'staff@bspagusancouncil.com': { email: 'staff@bspagusancouncil.com', role: 'viewer', password: VIEWER_ACCOUNT_PASSWORD }
};
const unique = values => [...new Set((values || []).filter(Boolean))];
const formatLocalDate = d => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const today = () => formatLocalDate(new Date());
const shiftDate = (dateStr, deltaDays) => {
  const base = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return today();
  base.setDate(base.getDate() + deltaDays);
  return formatLocalDate(base);
};
const formatDisplayDate = dateStr => {
  if (!dateStr) return 'All dates';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};
const formatLongDate = dateStr => {
  if (!dateStr) return '';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};
const money = n => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n || 0));
const fmt = n => new Intl.NumberFormat('en-PH').format(Number(n || 0));
const fmtDec = n => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));
const svgToDataUrl = svg => (svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : '');
const readStoredValue = key => {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
};
const scoutsOf = r => SECTIONS.reduce((sum, [key]) => sum + Number(r[key] || 0), 0);
const totalsOf = records => records.reduce((a, r) => {
  SECTIONS.forEach(([key]) => a[key] += Number(r[key] || 0));
  LEADER_SECTIONS.forEach(([key]) => a[key] += Number(r[key] || 0));
  a.scouts += scoutsOf(r);
  a.leaders += Number(r.leaders || 0);
  a.heads += Number(r.heads || 0);
  a.leaderMale += Number(r.leaderMale || 0);
  a.leaderFemale += Number(r.leaderFemale || 0);
  a.headMale += Number(r.headMale || 0);
  a.headFemale += Number(r.headFemale || 0);
  a.entries += 1;
  a.paid += Number(r.paid || 0);
  a.male += Number(r.male || 0);
  a.female += Number(r.female || 0);
  return a;
}, {
  scouts: 0,
  leaders: 0,
  heads: 0,
  leaderMale: 0,
  leaderFemale: 0,
  headMale: 0,
  headFemale: 0,
  entries: 0,
  paid: 0,
  male: 0,
  female: 0,
  kid: 0,
  kab: 0,
  boy: 0,
  senior: 0,
  rover: 0,
  langkayLeader: 0,
  kawanLeader: 0,
  troopLeader: 0,
  outfitAdvisor: 0,
  circleManager: 0
});
const normalizeRecord = record => ({
  ...record,
  langkayLeader: record?.langkayLeader ?? 0,
  kawanLeader: record?.kawanLeader ?? 0,
  troopLeader: record?.troopLeader ?? 0,
  outfitAdvisor: record?.outfitAdvisor ?? 0,
  circleManager: record?.circleManager ?? 0,
  leaderMale: record?.leaderMale ?? 0,
  leaderFemale: record?.leaderFemale ?? 0,
  headMale: record?.headMale ?? 0,
  headFemale: record?.headFemale ?? 0
});
const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...EMPTY, ...saved, records: (saved.records || []).map(normalizeRecord) };
  } catch {
    return EMPTY;
  }
};

function Metric({ label, value, note, icon: Icon }) {
  return <article className="metric"><div className="metric-top"><span>{label}</span><Icon size={18}/></div><strong>{value}</strong><small>{note}</small></article>;
}
function MetricWithGender({ label, total, male, female, note, icon: Icon }) {
  return <article className="metric metric-with-gender"><div className="metric-top"><span>{label}</span><Icon size={18}/></div><strong>{total}</strong><div className="metric-gender-row"><span>Male: {male}</span><span>Female: {female}</span></div><small>{note}</small></article>;
}
function Panel({ title, subtitle, action, children, className = '' }) {
  return <section className={`panel ${className}`}><div className="panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action && <div>{action}</div>}</div>{children}</section>;
}
function EmptyChart() { return <div className="empty-chart">No data available yet. Add registration records to generate this chart.</div>; }

const getStoredUser = () => {
  try {
    // Invalidate and clear any old/previous sessions from all devices
    localStorage.removeItem('bspAgusanAuth');

    const saved = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
    if (!saved || saved.sessionVersion !== CURRENT_AUTH_SESSION_VERSION) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return AUTH_USERS[saved.email] ? AUTH_USERS[saved.email] : null;
  } catch {
    return null;
  }
};

export default function App() {
  const [db, setDb] = useState(load);
  const [authUser, setAuthUser] = useState(getStoredUser);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [page, setPage] = useState('dashboard');
  const [selectedDivision, setSelectedDivision] = useState(DEFAULT_DIVISIONS[0]);
  const [dashboardDivision, setDashboardDivision] = useState('all');
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (dashboardDivision === 'all') {
      setSelectedDivision(prev => (db.divisions.includes(prev) ? prev : (db.divisions[0] || '')));
      return;
    }
    setSelectedDivision(dashboardDivision);
  }, [dashboardDivision, db.divisions]);
  const [selectedMonth, setSelectedMonth] = useState('to-date');
  const [periodMode, setPeriodMode] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState(today);
  const [dateRangeStart, setDateRangeStart] = useState(today);
  const [dateRangeEnd, setDateRangeEnd] = useState(today);
  const [trendView, setTrendView] = useState('monthly');
  const [reportTab, setReportTab] = useState('summary');
  const [transmittalMonth, setTransmittalMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [transmittalYear, setTransmittalYear] = useState(() => String(new Date().getFullYear()));
  const [transmittalDate, setTransmittalDate] = useState(today);
  const [transmittalOverrides, setTransmittalOverrides] = useState({});
  const [transmittalSignature, setTransmittalSignature] = useState(() => readStoredValue(TRANSMITTAL_SIGNATURE_KEY));
  const [mmrrMonth, setMmrrMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [mmrrYear, setMmrrYear] = useState(() => String(new Date().getFullYear()));
  const [mmrrOverrides, setMmrrOverrides] = useState({});
  const [mmrrPerf, setMmrrPerf] = useState({});
  const [mmrrPreparedDate, setMmrrPreparedDate] = useState(today);
  const [mmrrCertifiedDate, setMmrrCertifiedDate] = useState(today);
  const [mmrrPreparedSig, setMmrrPreparedSig] = useState(() => readStoredValue(MMRR_PREPARED_SIG_KEY));
  const [mmrrCertifiedSig, setMmrrCertifiedSig] = useState(() => readStoredValue(MMRR_CERTIFIED_SIG_KEY));
  const [mmrrPreparedName, setMmrrPreparedName] = useState(() => readStoredValue(MMRR_PREPARED_NAME_KEY));
  const [mmrrCertifiedName, setMmrrCertifiedName] = useState(() => readStoredValue(MMRR_CERTIFIED_NAME_KEY));
  const [query, setQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [filterUnassignedOnly, setFilterUnassignedOnly] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [chartDetail, setChartDetail] = useState(null);
  const [leaderChartType, setLeaderChartType] = useState('bar');
  const [connectionInfo, setConnectionInfo] = useState(getSupabaseConfig());
  const [form, setForm] = useState({
    division: DEFAULT_DIVISIONS[0], district: '', school: '', date: today(),
    receipt: '', aur: '', kid: 0, kab: 0, boy: 0, senior: 0, rover: 0,
    male: 0, female: 0,
    langkayLeader: 0, kawanLeader: 0, troopLeader: 0, outfitAdvisor: 0, circleManager: 0,
    leaders: 0, heads: 0, leaderMale: 0, leaderFemale: 0, headMale: 0, headFemale: 0,
    scoutFee: 0, leaderFee: 0, institutionFee: 0, paid: 0, paymentNotes: ''
  });

  useEffect(() => {
    if (dashboardDivision === 'all') {
      setSelectedDivision(prev => (db.divisions.includes(prev) ? prev : (db.divisions[0] || '')));
      return;
    }
    setSelectedDivision(dashboardDivision);
  }, [dashboardDivision, db.divisions]);

  useEffect(() => {
    if (authUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        ...authUser,
        sessionVersion: CURRENT_AUTH_SESSION_VERSION
      }));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('bspAgusanAuth');
    }
  }, [authUser]);

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
        const nextState = { ...EMPTY, ...data.payload, records: (data.payload.records || []).map(normalizeRecord), schools: data.payload.schools || {} };
        setDb(nextState);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
        return;
      }

      const [divisionResult, districtResult, schoolResult] = await Promise.all([
        supabase.from('divisions').select('name').order('name'),
        supabase.from('districts').select('division_name, name').order('division_name, name'),
        supabase.from('schools').select('division_name, district_name, name').order('division_name, district_name, name')
      ]);

      if (!isMounted) return;

      if (!divisionResult.error && divisionResult.data) {
        const divisions = divisionResult.data.map(row => row.name);
        const districts = {};
        (districtResult.data || []).forEach(row => {
          districts[row.division_name] = [...new Set([...(districts[row.division_name] || []), row.name])];
        });
        const schools = {};
        (schoolResult.data || []).forEach(row => {
          schools[row.division_name] ||= {};
          schools[row.division_name][row.district_name] = [...new Set([...(schools[row.division_name][row.district_name] || []), row.name])];
        });

        setDb(prev => ({ ...prev, divisions, districts, schools }));
      }
    };

    loadRemote();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const persist = async () => {
      if (supabase) {
        try {
          const tables = await Promise.all([
            supabase.from('divisions').upsert((db.divisions || []).map(name => ({ name })), { onConflict: 'name' }),
            supabase.from('districts').upsert(Object.entries(db.districts || {}).flatMap(([division, names]) => (names || []).map(name => ({ division_name: division, name }))), { onConflict: 'division_name,name' }),
            supabase.from('schools').upsert(Object.entries(db.schools || {}).flatMap(([division, districtMap]) => Object.entries(districtMap || {}).flatMap(([district, names]) => (names || []).map(name => ({ division_name: division, district_name: district, name })))), { onConflict: 'division_name,district_name,name' })
          ]);

          const tableError = tables.find(result => result?.error);
          if (tableError) {
            throw tableError.error;
          }

          const { error } = await supabase.from('bsp_app_state').upsert({ id: 'app-data', payload: db }, { onConflict: 'id' });
          if (error) throw error;
          setConnectionInfo(getSupabaseConfig());
        } catch (error) {
          console.warn('Supabase save error:', error);
          setConnectionInfo({ ...getSupabaseConfig(), connected: false, error: error.message });
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    };

    persist();
  }, [db]);

  const records = db.records || [];
  const unassignedLeaderRecords = records
    .map(r => {
      const totalLeaders = Number(r.leaders || 0);
      const assigned = leaderSectionsOf(r);
      const unassigned = totalLeaders - assigned;
      if (unassigned <= 0) return null;
      return {
        ...r,
        totalLeaders,
        assigned,
        unassigned
      };
    })
    .filter(Boolean);
  const totalUnassignedLeaders = unassignedLeaderRecords.reduce((sum, r) => sum + r.unassigned, 0);
  const validationIssues = records
    .map(r => {
      const scoutTotal = scoutsOf(r);
      const maleTotal = Number(r.male || 0);
      const femaleTotal = Number(r.female || 0);
      const leaderTotal = Number(r.leaders || 0);
      const leaderMale = Number(r.leaderMale || 0);
      const leaderFemale = Number(r.leaderFemale || 0);
      const headTotal = Number(r.heads || 0);
      const headMale = Number(r.headMale || 0);
      const headFemale = Number(r.headFemale || 0);
      const scoutMismatch = maleTotal + femaleTotal !== scoutTotal;
      const leaderMismatch = leaderMale + leaderFemale !== leaderTotal;
      const headMismatch = headMale + headFemale !== headTotal;
      if (!scoutMismatch && !leaderMismatch && !headMismatch) return null;
      return {
        id: r.id,
        date: r.date || '—',
        division: r.division || '—',
        district: r.district || '—',
        school: r.school || '—',
        receipt: r.receipt || '—',
        scoutMismatch,
        leaderMismatch,
        headMismatch,
        scoutExpected: scoutTotal,
        scoutActual: maleTotal + femaleTotal,
        leaderExpected: leaderTotal,
        leaderActual: leaderMale + leaderFemale,
        headExpected: headTotal,
        headActual: headMale + headFemale
      };
    })
    .filter(Boolean);
  const isAdmin = authUser?.role === 'admin';
  const isViewer = authUser?.role === 'viewer';
  const yearOptions = [...new Set([new Date().getFullYear(), ...records.map(r => Number((r.date || '').slice(0, 4))).filter(Boolean)])].sort((a,b) => b-a);
  const monthOptions = ['all', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const currentMonth = new Date().getMonth() + 1;
  const [rangeFrom, rangeTo] = dateRangeStart && dateRangeEnd && dateRangeStart > dateRangeEnd
    ? [dateRangeEnd, dateRangeStart]
    : [dateRangeStart, dateRangeEnd];
  const dashboardRecords = records.filter(r => {
    if (dashboardDivision !== 'all' && r.division !== dashboardDivision) return false;
    const recordDate = (r.date || '').slice(0, 10);
    if (periodMode === 'daily') {
      return selectedDate ? recordDate === selectedDate : true;
    }
    if (periodMode === 'range') {
      if (!recordDate) return false;
      if (rangeFrom && recordDate < rangeFrom) return false;
      if (rangeTo && recordDate > rangeTo) return false;
      return true;
    }
    if (year === 'all') return true;
    if (!recordDate.startsWith(year)) return false;
    if (selectedMonth === 'all') return true;
    if (selectedMonth === 'to-date') {
      const monthNumber = Number(recordDate.slice(5, 7));
      return monthNumber <= currentMonth;
    }
    return recordDate.slice(5, 7) === selectedMonth;
  });
  const periodLabel = periodMode === 'daily'
    ? formatDisplayDate(selectedDate)
    : periodMode === 'range'
      ? rangeFrom && rangeTo
        ? `${formatDisplayDate(rangeFrom)} – ${formatDisplayDate(rangeTo)}`
        : rangeFrom
          ? `From ${formatDisplayDate(rangeFrom)}`
          : rangeTo
            ? `Up to ${formatDisplayDate(rangeTo)}`
            : 'All dates'
      : year === 'all'
        ? 'All years'
        : selectedMonth === 'all'
          ? `All months (${year})`
          : selectedMonth === 'to-date'
            ? `January to ${new Date(`${year}-${String(currentMonth).padStart(2, '0')}-01`).toLocaleDateString('en-PH', { month: 'long' })} ${year}`
            : `${new Date(`${year}-${selectedMonth}-01`).toLocaleDateString('en-PH', { month: 'long' })} ${year}`;
  const totals = totalsOf(dashboardRecords);
  const scoutByDivision = db.divisions.map(name => {
    const recordsForDivision = dashboardRecords.filter(r => r.division === name);
    return {
      name: name.replace(' Division', ''),
      value: recordsForDivision.reduce((s, r) => s + scoutsOf(r), 0),
      records: recordsForDivision
    };
  });
  const leadersByDivision = db.divisions.map(name => {
    const recordsForDivision = dashboardRecords.filter(r => r.division === name);
    return {
      name: name.replace(' Division', ''),
      value: recordsForDivision.reduce((s, r) => s + Number(r.leaders || 0), 0),
      records: recordsForDivision
    };
  });
  const sectionData = SECTIONS.map(([key, label]) => ({
    name: label,
    total: totals[key],
    color: SECTION_COLORS[label] || '#174a78',
    records: dashboardRecords.filter(r => Number(r[key] || 0) > 0)
  }));
  const leaderSectionData = LEADER_SECTIONS.map(([key, label], idx) => ({
    name: label.replace(/ \(.*\)/, ''),
    fullName: label,
    total: totals[key] || 0,
    value: totals[key] || 0,
    color: SECTION_COLOR_LIST[idx] || '#174a78',
    records: dashboardRecords.filter(r => Number(r[key] || 0) > 0)
  }));
  const genderData = [
    { name: 'Male Scouts', value: totals.male, records: dashboardRecords.filter(r => Number(r.male || 0) > 0) },
    { name: 'Female Scouts', value: totals.female, records: dashboardRecords.filter(r => Number(r.female || 0) > 0) }
  ];
  const unitLeaderGenderData = [
    { name: 'Male Unit Leaders', value: totals.leaderMale, records: dashboardRecords.filter(r => Number(r.leaderMale || 0) > 0) },
    { name: 'Female Unit Leaders', value: totals.leaderFemale, records: dashboardRecords.filter(r => Number(r.leaderFemale || 0) > 0) }
  ];
  const institutionalHeadGenderData = [
    { name: 'Male Heads', value: totals.headMale, records: dashboardRecords.filter(r => Number(r.headMale || 0) > 0) },
    { name: 'Female Heads', value: totals.headFemale, records: dashboardRecords.filter(r => Number(r.headFemale || 0) > 0) }
  ];
  const trendData = useMemo(
    () => (trendView === 'daily' ? dailyData(dashboardRecords, 'scouts') : monthlyData(dashboardRecords, 'scouts')),
    [dashboardRecords, trendView]
  );
  const revenueData = useMemo(
    () => (trendView === 'daily' ? dailyData(dashboardRecords, 'paid') : monthlyData(dashboardRecords, 'paid')),
    [dashboardRecords, trendView]
  );
  const transmittalPeriodKey = `${transmittalYear}-${transmittalMonth}`;
  const transmittalYearOptions = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const recordYears = records.map(r => Number((r.date || '').slice(0, 4))).filter(Boolean);
    const minYear = Math.min(thisYear - 2, ...recordYears);
    const maxYear = Math.max(thisYear + 10, ...recordYears);
    const list = [];
    for (let y = minYear; y <= maxYear; y += 1) list.push(String(y));
    return list;
  }, [records]);
  const transmittalRows = useMemo(() => {
    const periodRecords = records.filter(r => (r.date || '').startsWith(transmittalPeriodKey));
    const normalizeDiv = v => String(v || '').trim().toLowerCase();
    const knownMatches = new Set(TRANSMITTAL_BASE_ROWS.flatMap(row => row.match));
    const extraDivisions = unique([
      ...db.divisions,
      ...periodRecords.map(r => r.division)
    ]).filter(div => !knownMatches.has(normalizeDiv(div)));
    const rowConfigs = [
      ...TRANSMITTAL_BASE_ROWS,
      ...extraDivisions.map(div => ({
        key: `extra-${normalizeDiv(div).replace(/[^a-z0-9]+/g, '-')}`,
        label: String(div).replace(/\s+division$/i, '').toUpperCase(),
        match: [normalizeDiv(div)]
      }))
    ];
    const periodOverrides = transmittalOverrides[transmittalPeriodKey] || {};
    return rowConfigs.map((cfg, index) => {
      const rowRecords = periodRecords.filter(r => cfg.match.includes(normalizeDiv(r.division)));
      const rowOverrides = periodOverrides[cfg.key] || {};
      const auto = {
        kidM: 0, kidF: 0, kabM: 0, kabF: 0, boyM: 0, boyF: 0, seniorM: 0, seniorF: 0, roverM: 0, roverF: 0,
        aisM: 0, aisF: 0
      };
      const sectionTotals = { kid: 0, kab: 0, boy: 0, senior: 0, rover: 0 };
      let mixedScouts = 0;
      let mixedMale = 0;
      let mixedFemale = 0;
      let unrecordedGenderScouts = 0;

      rowRecords.forEach(r => {
        const scoutTotal = scoutsOf(r);
        const rMale = Number(r.male || 0);
        const rFemale = Number(r.female || 0);
        auto.aisM += Number(r.leaderMale || 0) + Number(r.headMale || 0);
        auto.aisF += Number(r.leaderFemale || 0) + Number(r.headFemale || 0);
        SECTIONS.forEach(([secKey]) => {
          sectionTotals[secKey] += Number(r[secKey] || 0);
        });
        if (scoutTotal > 0) {
          if (rMale > 0 && rFemale === 0) {
            SECTIONS.forEach(([secKey]) => {
              auto[`${secKey}M`] += Number(r[secKey] || 0);
            });
          } else if (rFemale > 0 && rMale === 0) {
            SECTIONS.forEach(([secKey]) => {
              auto[`${secKey}F`] += Number(r[secKey] || 0);
            });
          } else if (rMale > 0 && rFemale > 0) {
            mixedScouts += scoutTotal;
            mixedMale += rMale;
            mixedFemale += rFemale;
          } else {
            unrecordedGenderScouts += scoutTotal;
          }
        }
      });

      const needsSplit = {};
      SECTIONS.forEach(([secKey]) => {
        const autoSplitSum = auto[`${secKey}M`] + auto[`${secKey}F`];
        const hasMissingSplit = sectionTotals[secKey] > autoSplitSum;
        const hasOverride = rowOverrides[`${secKey}M`] !== undefined || rowOverrides[`${secKey}F`] !== undefined;
        needsSplit[secKey] = hasMissingSplit && !hasOverride;
      });

      const val = field => (rowOverrides[field] !== undefined ? Number(rowOverrides[field] || 0) : auto[field]);
      const displayVal = (field, secKey) => {
        if (rowOverrides[field] !== undefined) return rowOverrides[field];
        if (secKey && needsSplit[secKey]) return '';
        return auto[field];
      };

      let totalScouts = 0;
      SECTIONS.forEach(([secKey]) => {
        const hasSecOverride = rowOverrides[`${secKey}M`] !== undefined || rowOverrides[`${secKey}F`] !== undefined;
        if (hasSecOverride) {
          totalScouts += val(`${secKey}M`) + val(`${secKey}F`);
        } else {
          totalScouts += Math.max(sectionTotals[secKey], auto[`${secKey}M`] + auto[`${secKey}F`]);
        }
      });

      const aisM = val('aisM');
      const aisF = val('aisF');
      const totalRegistered = totalScouts + aisM + aisF;

      return {
        no: index + 1,
        key: cfg.key,
        label: cfg.label,
        recordCount: rowRecords.length,
        auto,
        sectionTotals,
        needsSplit,
        hasMixedOrMissingGender: mixedScouts > 0 || unrecordedGenderScouts > 0,
        mixedMale,
        mixedFemale,
        unrecordedGenderScouts,
        val,
        displayVal,
        totalScouts,
        aisM,
        aisF,
        totalRegistered
      };
    });
  }, [records, db.divisions, transmittalPeriodKey, transmittalOverrides]);

  const transmittalTotals = useMemo(() => {
    const sum = {
      kidM: 0, kidF: 0, kabM: 0, kabF: 0, boyM: 0, boyF: 0, seniorM: 0, seniorF: 0, roverM: 0, roverF: 0,
      totalScouts: 0, aisM: 0, aisF: 0, totalRegistered: 0
    };
    transmittalRows.forEach(row => {
      SECTIONS.forEach(([secKey]) => {
        sum[`${secKey}M`] += row.val(`${secKey}M`);
        sum[`${secKey}F`] += row.val(`${secKey}F`);
      });
      sum.totalScouts += row.totalScouts;
      sum.aisM += row.aisM;
      sum.aisF += row.aisF;
      sum.totalRegistered += row.totalRegistered;
    });
    return sum;
  }, [transmittalRows]);

  const transmittalSignatureUrl = useMemo(() => svgToDataUrl(transmittalSignature), [transmittalSignature]);
  const mmrrPreparedSigUrl = useMemo(() => svgToDataUrl(mmrrPreparedSig), [mmrrPreparedSig]);
  const mmrrCertifiedSigUrl = useMemo(() => svgToDataUrl(mmrrCertifiedSig), [mmrrCertifiedSig]);
  const mmrrPeriodKey = `${mmrrYear}-${mmrrMonth}`;

  const mmrrData = useMemo(() => {
    const periodRecords = records.filter(r => (r.date || '').startsWith(mmrrPeriodKey));
    const periodOverrides = mmrrOverrides[mmrrPeriodKey] || {};
    const autoCounts = {};
    const fieldTotals = {};
    let mixedScoutNote = null;
    let mixedLeaderNote = null;

    MMRR_SECTIONS.forEach(sec => {
      sec.rows.forEach(row => {
        autoCounts[row.key] = { male: 0, female: 0, total: 0 };
        if (row.field) fieldTotals[row.field] = 0;
      });
    });

    let mixedScoutMale = 0;
    let mixedScoutFemale = 0;
    let unrecordedScoutTotal = 0;
    let mixedLeaderMale = 0;
    let mixedLeaderFemale = 0;
    let unrecordedLeaderTotal = 0;
    let unassignedLeaderCount = 0;

    periodRecords.forEach(r => {
      const rScouts = scoutsOf(r);
      const rMale = Number(r.male || 0);
      const rFemale = Number(r.female || 0);
      MMRR_SECTIONS[0].rows.forEach(row => {
        const count = Number(r[row.field] || 0);
        fieldTotals[row.field] += count;
        autoCounts[row.key].total += count;
        if (count > 0) {
          if (rMale > 0 && rFemale === 0) autoCounts[row.key].male += count;
          else if (rFemale > 0 && rMale === 0) autoCounts[row.key].female += count;
        }
      });
      if (rScouts > 0) {
        if (rMale > 0 && rFemale > 0) {
          mixedScoutMale += rMale;
          mixedScoutFemale += rFemale;
        } else if (rMale === 0 && rFemale === 0) {
          unrecordedScoutTotal += rScouts;
        }
      }

      const rLeaderAssigned = leaderSectionsOf(r);
      const rLeadersTotal = Number(r.leaders || 0);
      if (rLeadersTotal > rLeaderAssigned) {
        unassignedLeaderCount += rLeadersTotal - rLeaderAssigned;
      }
      const rLeaderMale = Number(r.leaderMale || 0);
      const rLeaderFemale = Number(r.leaderFemale || 0);
      MMRR_SECTIONS[1].rows.forEach(row => {
        const count = Number(r[row.field] || 0);
        fieldTotals[row.field] += count;
        autoCounts[row.key].total += count;
        if (count > 0) {
          if (rLeaderMale > 0 && rLeaderFemale === 0) autoCounts[row.key].male += count;
          else if (rLeaderFemale > 0 && rLeaderMale === 0) autoCounts[row.key].female += count;
        }
      });
      if (rLeaderAssigned > 0) {
        if (rLeaderMale > 0 && rLeaderFemale > 0) {
          mixedLeaderMale += rLeaderMale;
          mixedLeaderFemale += rLeaderFemale;
        } else if (rLeaderMale === 0 && rLeaderFemale === 0) {
          unrecordedLeaderTotal += rLeaderAssigned;
        }
      }

      const rHeadTotal = Number(r.heads || 0);
      const rHeadMale = Number(r.headMale || 0);
      const rHeadFemale = Number(r.headFemale || 0);
      fieldTotals.heads += rHeadTotal;
      autoCounts.isr.total += Math.max(rHeadTotal, rHeadMale + rHeadFemale);
      autoCounts.isr.male += rHeadMale;
      autoCounts.isr.female += rHeadFemale;
    });

    if (mixedScoutMale > 0 || mixedScoutFemale > 0 || unrecordedScoutTotal > 0) {
      mixedScoutNote = { male: mixedScoutMale, female: mixedScoutFemale, unrecorded: unrecordedScoutTotal };
    }
    if (mixedLeaderMale > 0 || mixedLeaderFemale > 0 || unrecordedLeaderTotal > 0 || unassignedLeaderCount > 0) {
      mixedLeaderNote = {
        male: mixedLeaderMale,
        female: mixedLeaderFemale,
        unrecorded: unrecordedLeaderTotal,
        unassigned: unassignedLeaderCount
      };
    }

    const sections = MMRR_SECTIONS.map(sec => {
      const rows = sec.rows.map(row => {
        const auto = autoCounts[row.key];
        const ov = periodOverrides[row.key] || {};
        const hasOverride = ov.male !== undefined || ov.female !== undefined;
        const needsSplit = !hasOverride && auto.total > auto.male + auto.female;
        const male = ov.male !== undefined ? Number(ov.male || 0) : auto.male;
        const female = ov.female !== undefined ? Number(ov.female || 0) : auto.female;
        const total = hasOverride ? male + female : Math.max(auto.total, male + female);
        const totalFees = total * row.fee;
        return {
          ...row,
          male,
          female,
          total,
          totalFees,
          needsSplit,
          displayMale: ov.male !== undefined ? ov.male : (needsSplit && auto.male === 0 ? '' : auto.male),
          displayFemale: ov.female !== undefined ? ov.female : (needsSplit && auto.female === 0 ? '' : auto.female)
        };
      });
      const subTotal = rows.reduce(
        (acc, r) => ({
          male: acc.male + r.male,
          female: acc.female + r.female,
          total: acc.total + r.total,
          totalFees: acc.totalFees + r.totalFees
        }),
        { male: 0, female: 0, total: 0, totalFees: 0 }
      );
      return { ...sec, rows, subTotal };
    });

    const grandTotal = sections.reduce(
      (acc, sec) => ({
        male: acc.male + sec.subTotal.male,
        female: acc.female + sec.subTotal.female,
        total: acc.total + sec.subTotal.total,
        totalFees: acc.totalFees + sec.subTotal.totalFees
      }),
      { male: 0, female: 0, total: 0, totalFees: 0 }
    );

    const autoInstitutions = unique(
      periodRecords.map(r => `${r.division || ''}|${r.district || ''}|${r.school || ''}`)
    ).length;
    const institutions = periodOverrides._institutions !== undefined
      ? Number(periodOverrides._institutions || 0)
      : autoInstitutions;

    const units = MMRR_UNITS.map(u => {
      const autoCount = periodRecords.filter(
        r => Number(r[u.scoutField] || 0) > 0 || Number(r[u.leaderField] || 0) > 0
      ).length;
      const ovUnit = periodOverrides[`_unit_${u.key}`];
      const count = ovUnit !== undefined ? Number(ovUnit || 0) : autoCount;
      return { ...u, count, displayCount: ovUnit !== undefined ? ovUnit : autoCount };
    });
    const unitsTotal = units.reduce((sum, u) => sum + u.count, 0);

    return {
      sections,
      grandTotal,
      institutions,
      displayInstitutions: periodOverrides._institutions !== undefined ? periodOverrides._institutions : autoInstitutions,
      units,
      unitsTotal,
      mixedScoutNote,
      mixedLeaderNote
    };
  }, [records, mmrrPeriodKey, mmrrOverrides]);

  function updateMmrrRowCell(rowKey, side, rawValue) {
    setMmrrOverrides(prev => {
      const periodMap = { ...(prev[mmrrPeriodKey] || {}) };
      const rowMap = { ...(periodMap[rowKey] || {}) };
      if (rawValue === '') {
        delete rowMap[side];
      } else {
        rowMap[side] = Math.max(0, Number(rawValue) || 0);
      }
      if (Object.keys(rowMap).length === 0) {
        delete periodMap[rowKey];
      } else {
        periodMap[rowKey] = rowMap;
      }
      return { ...prev, [mmrrPeriodKey]: periodMap };
    });
  }
  function updateMmrrMetaCount(metaKey, rawValue) {
    setMmrrOverrides(prev => {
      const periodMap = { ...(prev[mmrrPeriodKey] || {}) };
      if (rawValue === '') {
        delete periodMap[metaKey];
      } else {
        periodMap[metaKey] = Math.max(0, Number(rawValue) || 0);
      }
      return { ...prev, [mmrrPeriodKey]: periodMap };
    });
  }
  function resetMmrrOverrides() {
    setMmrrOverrides(prev => {
      const next = { ...prev };
      delete next[mmrrPeriodKey];
      return next;
    });
  }
  function updateMmrrPerf(field, rawValue) {
    setMmrrPerf(prev => ({
      ...prev,
      [mmrrYear]: { ...(prev[mmrrYear] || {}), [field]: rawValue }
    }));
  }
  function handleSvgUpload(e, setter, storageKey) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '').trim();
      if (!/<svg[\s>]/i.test(content)) {
        window.alert('Please upload a valid SVG file (.svg).');
        return;
      }
      setter(content);
      try {
        localStorage.setItem(storageKey, content);
      } catch {
        // Ignore storage quota errors
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }
  function clearSvgSignature(setter, storageKey) {
    setter('');
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage errors
    }
  }

  function updateTransmittalCell(rowKey, field, rawValue) {
    setTransmittalOverrides(prev => {
      const periodMap = { ...(prev[transmittalPeriodKey] || {}) };
      const rowMap = { ...(periodMap[rowKey] || {}) };
      if (rawValue === '') {
        delete rowMap[field];
      } else {
        rowMap[field] = Math.max(0, Number(rawValue) || 0);
      }
      periodMap[rowKey] = rowMap;
      return { ...prev, [transmittalPeriodKey]: periodMap };
    });
  }
  function resetTransmittalOverrides() {
    setTransmittalOverrides(prev => {
      const next = { ...prev };
      delete next[transmittalPeriodKey];
      return next;
    });
  }
  function handleSignatureUpload(e) {
    handleSvgUpload(e, setTransmittalSignature, TRANSMITTAL_SIGNATURE_KEY);
  }
  function clearTransmittalSignature() {
    clearSvgSignature(setTransmittalSignature, TRANSMITTAL_SIGNATURE_KEY);
  }
  const districtNames = [...new Set([
    ...(db.districts[selectedDivision] || []),
    ...dashboardRecords.filter(r => r.division === selectedDivision).map(r => r.district).filter(Boolean)
  ])];
  const districtOptions = unique([
    ...(db.districts[form.division] || []),
    ...records.filter(r => r.division === form.division).map(r => r.district)
  ]);
  const schoolOptions = unique([
    ...(db.schools?.[form.division]?.[form.district] || []),
    ...records.filter(r => r.division === form.division && r.district === form.district).map(r => r.school)
  ]);
  const districtScouts = districtNames.map(name => {
    const recordsForDistrict = dashboardRecords.filter(r => r.division === selectedDivision && r.district === name);
    return {
      name,
      value: recordsForDistrict.reduce((s,r) => s + scoutsOf(r), 0),
      records: recordsForDistrict
    };
  });
  const districtLeaders = districtNames.map(name => {
    const recordsForDistrict = dashboardRecords.filter(r => r.division === selectedDivision && r.district === name);
    return {
      name,
      value: recordsForDistrict.reduce((s,r) => s + Number(r.leaders || 0), 0),
      records: recordsForDistrict
    };
  });

  function openChartDetail(item) {
    if (!item?.records || item.records.length === 0) return;
    setChartDetail({
      title: item.name || item.period || 'Registration detail',
      records: item.records
    });
  }
  function closeChartDetail() { setChartDetail(null); }

  function setField(key, value) { setForm(prev => ({ ...prev, [key]: value })); }
  const formScouts = scoutsOf(form);
  const formLeaderSections = leaderSectionsOf(form);
  const formLeaders = formLeaderSections > 0 ? formLeaderSections : Number(form.leaders || 0);
  const expected = formScouts * Number(form.scoutFee || 0)
    + Number(formLeaders) * Number(form.leaderFee || 0)
    + Number(form.heads || 0) * Number(form.institutionFee || 0);

  function resetForm() {
    setEditingId(null);
    setForm({
      division: db.divisions[0] || '', district: '', school: '', date: today(), receipt: '', aur: '',
      kid: 0, kab: 0, boy: 0, senior: 0, rover: 0, male: 0, female: 0,
      langkayLeader: 0, kawanLeader: 0, troopLeader: 0, outfitAdvisor: 0, circleManager: 0,
      leaders: 0, leaderMale: 0, leaderFemale: 0,
      heads: 0, headMale: 0, headFemale: 0,
      scoutFee: 0, leaderFee: 0, institutionFee: 0, paid: 0, paymentNotes: ''
    });
  }
  function saveRecord(e) {
    if (!isAdmin) {
      window.alert('Only the admin account can save registration records.');
      return;
    }
    e.preventDefault();
    const finalLeaders = formLeaderSections > 0 ? formLeaderSections : Number(form.leaders || 0);
    const record = { ...form, leaders: finalLeaders, id: editingId || crypto.randomUUID(), expected };
    const leaderGenderMismatch = Number(finalLeaders) !== Number(form.leaderMale) + Number(form.leaderFemale);
    const headGenderMismatch = Number(form.heads) !== Number(form.headMale) + Number(form.headFemale);
    if ((Number(form.male) + Number(form.female) !== formScouts || leaderGenderMismatch || headGenderMismatch) &&
      !window.confirm('One or more gender counts do not equal the total registered count. Save anyway?')) return;
    setDb(prev => {
      const exists = prev.records.some(r => r.id === record.id);
      const nextRecords = exists ? prev.records.map(r => r.id === record.id ? record : r) : [...prev.records, record];
      const normalizedDistrict = String(record.district || '').trim();
      const normalizedSchool = String(record.school || '').trim();
      const districts = { ...prev.districts, [record.division]: unique([...(prev.districts[record.division] || []), normalizedDistrict]) };
      const divisionSchools = { ...(prev.schools?.[record.division] || {}) };
      divisionSchools[normalizedDistrict] = unique([...(divisionSchools[normalizedDistrict] || []), normalizedSchool]);
      return { ...prev, records: nextRecords, districts, schools: { ...prev.schools, [record.division]: divisionSchools } };
    });
    resetForm(); setPage('registrations');
  }
  function editRecord(r) {
    if (!isAdmin) {
      window.alert('Only the admin account can edit records.');
      return;
    }
    setForm({
      ...r,
      langkayLeader: r.langkayLeader ?? 0,
      kawanLeader: r.kawanLeader ?? 0,
      troopLeader: r.troopLeader ?? 0,
      outfitAdvisor: r.outfitAdvisor ?? 0,
      circleManager: r.circleManager ?? 0,
      leaderMale: r.leaderMale ?? 0,
      leaderFemale: r.leaderFemale ?? 0,
      headMale: r.headMale ?? 0,
      headFemale: r.headFemale ?? 0,
      male: r.male ?? 0,
      female: r.female ?? 0,
      leaders: r.leaders ?? 0,
      heads: r.heads ?? 0
    }); setEditingId(r.id); setPage('form');
  }
  function deleteRecord(id) {
    if (!isAdmin) {
      window.alert('Only the admin account can delete records.');
      return;
    }
    if (window.confirm('Delete this registration record?')) setDb(prev => ({ ...prev, records: prev.records.filter(r => r.id !== id) }));
  }
  function addDivision() {
    if (!isAdmin) {
      window.alert('Only the admin account can manage divisions.');
      return;
    }
    const value = window.prompt('Enter the new division name:')?.trim();
    if (!value) return;
    if (db.divisions.some(d => d.toLowerCase() === value.toLowerCase())) return window.alert('Division already exists.');
    setDb(prev => ({ ...prev, divisions: [...prev.divisions, value], districts: { ...prev.districts, [value]: [] } }));
  }
  function addDistrict() {
    if (!isAdmin) {
      window.alert('Only the admin account can manage districts.');
      return;
    }
    const division = window.prompt('Enter the division name exactly as listed:\n' + db.divisions.join('\n'))?.trim();
    if (!division || !db.divisions.includes(division)) return window.alert('Please enter an existing division name.');
    const district = window.prompt(`Enter a district under ${division}:`)?.trim();
    if (!district) return;
    setDb(prev => ({ ...prev, districts: { ...prev.districts, [division]: unique([...(prev.districts[division] || []), district]) } }));
  }
  function addSchool() {
    if (!isAdmin) {
      window.alert('Only the admin account can manage schools.');
      return;
    }
    const division = window.prompt('Enter the division name exactly as listed:\n' + db.divisions.join('\n'))?.trim();
    if (!division || !db.divisions.includes(division)) return window.alert('Please enter an existing division name.');
    const district = window.prompt(`Enter the district under ${division}:`)?.trim();
    if (!district) return;
    const school = window.prompt(`Enter the school name under ${division} / ${district}:`)?.trim();
    if (!school) return;
    setDb(prev => {
      const districts = { ...prev.districts, [division]: unique([...(prev.districts[division] || []), district]) };
      const divisionSchools = { ...(prev.schools?.[division] || {}) };
      divisionSchools[district] = unique([...(divisionSchools[district] || []), school]);
      return { ...prev, districts, schools: { ...prev.schools, [division]: divisionSchools } };
    });
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
    const cols = ['date','division','district','school','kid','kab','boy','senior','rover','male','female','langkayLeader','kawanLeader','troopLeader','outfitAdvisor','circleManager','leaders','leaderMale','leaderFemale','heads','headMale','headFemale','receipt','aur','scoutFee','leaderFee','institutionFee','expected','paid','paymentNotes'];
    const csv = [cols.join(','), ...records.map(r => cols.map(k => `"${String(r[k] ?? '').replaceAll('"','""')}"`).join(','))].join('\n');
    download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'BSP-Agusan-Registrations.csv');
  }
  function download(blob, filename) {
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }
  function printPage() { window.print(); }

  const invoiceNumberValue = value => {
    const match = String(value || '').match(/\d+/g);
    return match ? Number(match.join('')) : Number.MAX_SAFE_INTEGER;
  };

  const filteredRecords = records.filter(r => {
    if (divisionFilter && r.division !== divisionFilter) return false;
    if (filterUnassignedOnly && (Number(r.leaders || 0) <= leaderSectionsOf(r) || Number(r.leaders || 0) === 0)) return false;
    return [r.school, r.district, r.receipt, r.aur, r.division].join(' ').toLowerCase().includes(query.toLowerCase());
  }).sort((a,b) => {
    const invoiceDiff = invoiceNumberValue(a.receipt) - invoiceNumberValue(b.receipt);
    if (invoiceDiff !== 0) return invoiceDiff;
    return (b.date || '').localeCompare(a.date || '');
  });

  const navItems = [
    ['dashboard', 'Dashboard', LayoutDashboard],
    ['registrations', 'Registrations', ClipboardList],
    ...(isAdmin ? [['form', 'Add Registration', PlusCircle]] : []),
    ['reports', 'Reports', FileText],
    ...(isAdmin ? [['settings', 'Divisions & Districts', Settings]] : [])
  ];
  function navigate(id) {
    if ((id === 'form' || id === 'settings') && !isAdmin) {
      window.alert('This area is restricted to the admin account.');
      return;
    }
    setPage(id); setMobileNav(false);
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    const email = loginForm.email.trim().toLowerCase();
    const account = AUTH_USERS[email];
    if (!account) {
      window.alert('Access denied. Use one of the approved BSP council accounts.');
      return;
    }
    if (loginForm.password && loginForm.password !== account.password) {
      window.alert('Incorrect password for this account.');
      return;
    }
    setAuthUser(account);
    setPage('dashboard');
    setLoginForm({ email: '', password: '' });
  }

  function handleLogout() {
    setAuthUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('bspAgusanAuth');
    setPage('dashboard');
  }

  if (!authUser) {
    return <div className="auth-shell">
      <div className="auth-layout">
        <div className="auth-visual">
          <div className="auth-brand"><div className="auth-logo-wrap"><img src="/bspaclogo.png" alt="BSP Agusan Council logo" className="brand-logo" /></div><div className="auth-brand-copy"><b>AGUSAN COUNCIL</b><span>Registration Analytics & Reporting System</span></div></div>
          <div className="auth-card">
            <h2>Scouts by Division</h2>
            <p>Interactive council overview preview</p>
            <div className="login-chart-wrap">
              <ChartPie data={scoutByDivision.map(item => ({ name: item.name, value: item.value }))} />
            </div>
          </div>
        </div>
        <div className="auth-panel">
          <div className="auth-panel-inner">
            <span className="auth-badge">Secure access</span>
            <h1>Sign in</h1>
            <p>Use your BSP Agusan Council account to continue.</p>
            <form onSubmit={handleLoginSubmit} className="login-form">
              <label className="field">
                <span>Email address</span>
                <input type="email" value={loginForm.email} onChange={e => setLoginForm(prev => ({ ...prev, email: e.target.value }))} placeholder="name@bspagusancouncil.com" required />
              </label>
              <label className="field">
                <span>Password</span>
                <input type="password" value={loginForm.password} onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))} placeholder="Enter your password" />
              </label>
              <div className="login-help">
                <strong>Approved accounts</strong>
                <div>Admin: christian@bspagusancouncil.com</div>
                <div>Viewer: staff@bspagusancouncil.com</div>
                <div><b>Contact Brando Faelnar for access</b></div>
              </div>
              <button type="submit" className="btn gold wide">Log in</button>
            </form>
          </div>
        </div>
      </div>
    </div>;
  }

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark logo-badge"><img src="/bspaclogo.png" alt="BSP Agusan Council logo" className="brand-logo" /></div><div><b>AGUSAN COUNCIL</b><span>Registration Analytics & Reporting System</span></div></div>
      <div className="top-actions">
        <span className="user-badge">{authUser.role === 'admin' ? 'Admin' : 'Viewer'} · {authUser.email}</span>
        <span className={`connection-pill ${connectionInfo.connected ? 'online' : 'offline'}`}>
          {connectionInfo.connected ? 'Supabase connected' : 'Local storage mode'}
        </span>
        {unassignedLeaderRecords.length > 0 && (
          <button
            type="button"
            className="btn outline"
            style={{
              background: '#fffbeb',
              borderColor: '#fcd34d',
              color: '#92400e',
              padding: '7px 11px',
              fontSize: '11px',
              fontWeight: 700
            }}
            onClick={() => {
              setFilterUnassignedOnly(true);
              setPage('registrations');
            }}
            title="Click to view registrations with unassigned unit leaders"
          >
            ⚠️ {unassignedLeaderRecords.length} Unassigned ({totalUnassignedLeaders} Leaders)
          </button>
        )}
        <button className="btn light" onClick={backup}><Download size={16}/> Backup</button>
        {isAdmin && <label className="btn light file-button"><Upload size={16}/> Import<input type="file" accept=".json" onChange={importBackup}/></label>}
        <button className="btn gold" onClick={printPage}><Printer size={16}/> Print</button>
        <button className="btn outline" onClick={handleLogout}>Log out</button>
        <button className="icon-button mobile-toggle" onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X/> : <Menu/>}</button>
      </div>
    </header>
    <div className="app-layout">
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="side-label">WORKSPACE</div>
        {navItems.map(([id, label, Icon]) => (
          <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => navigate(id)}>
            <Icon size={18}/>
            {label}
            {id === 'registrations' && unassignedLeaderRecords.length > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a',
                borderRadius: '10px',
                fontSize: '10px',
                padding: '1px 6px',
                fontWeight: 700
              }}>
                {unassignedLeaderRecords.length}
              </span>
            )}
          </button>
        ))}
        <div className="sidebar-note"><b>BSP Agusan Council</b><span>Registration data workspace</span></div>
      </aside>
      <main className="content">
        {page === 'dashboard' && <section className="page">
          <div className="page-heading">
            <div><h1>Council Overview</h1><p>Registration performance, membership distribution, and collections.</p></div>
            <div className="header-controls">
              <select
                className="control"
                aria-label="Dashboard period mode"
                value={periodMode}
                onChange={e => {
                  const nextMode = e.target.value;
                  setPeriodMode(nextMode);
                  if (nextMode === 'daily' || nextMode === 'range') {
                    setTrendView('daily');
                  } else if (selectedMonth === 'all' || selectedMonth === 'to-date') {
                    setTrendView('monthly');
                  }
                }}
              >
                <option value="monthly">By Month</option>
                <option value="daily">By Date (Daily)</option>
                <option value="range">Date Range</option>
              </select>
              {periodMode === 'monthly' && (
                <>
                  <select
                    className="control year-select"
                    value={year}
                    onChange={e => {
                      const nextYear = e.target.value;
                      setYear(nextYear);
                      if (nextYear === 'all') {
                        setSelectedMonth('all');
                        setTrendView('monthly');
                      } else {
                        setSelectedMonth('to-date');
                        setTrendView('monthly');
                      }
                    }}
                  >
                    <option value="all">All years</option>
                    {yearOptions.map(y => <option key={y}>{y}</option>)}
                  </select>
                  <select
                    className="control"
                    value={selectedMonth}
                    onChange={e => {
                      const nextMonth = e.target.value;
                      setSelectedMonth(nextMonth);
                      setTrendView(nextMonth !== 'all' && nextMonth !== 'to-date' ? 'daily' : 'monthly');
                    }}
                    disabled={year === 'all'}
                  >
                    <option value="all">All months</option>
                    <option value="to-date">From January to current month</option>
                    {monthOptions.filter(m => m !== 'all').map(month => <option key={month} value={month}>{new Date(`${year}-${month}-01`).toLocaleDateString('en-PH', { month: 'long' })}</option>)}
                  </select>
                </>
              )}
              {periodMode === 'daily' && (
                <div className="date-nav-group">
                  <button
                    type="button"
                    className="date-step-btn"
                    title="Previous day"
                    aria-label="Previous day"
                    onClick={() => setSelectedDate(prev => shiftDate(prev, -1))}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <input
                    type="date"
                    className="control date-control"
                    aria-label="Filter by date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                  />
                  <button
                    type="button"
                    className="date-step-btn"
                    title="Next day"
                    aria-label="Next day"
                    onClick={() => setSelectedDate(prev => shiftDate(prev, 1))}
                  >
                    <ChevronRight size={14} />
                  </button>
                  {selectedDate !== today() && (
                    <button
                      type="button"
                      className="btn outline date-today-btn"
                      onClick={() => setSelectedDate(today())}
                    >
                      Today
                    </button>
                  )}
                </div>
              )}
              {periodMode === 'range' && (
                <div className="date-range-group">
                  <input
                    type="date"
                    className="control date-control"
                    aria-label="Start date"
                    value={dateRangeStart}
                    max={dateRangeEnd || undefined}
                    onChange={e => setDateRangeStart(e.target.value)}
                  />
                  <span className="range-sep">to</span>
                  <input
                    type="date"
                    className="control date-control"
                    aria-label="End date"
                    value={dateRangeEnd}
                    min={dateRangeStart || undefined}
                    onChange={e => setDateRangeEnd(e.target.value)}
                  />
                </div>
              )}
              <select className="control" value={dashboardDivision} onChange={e => setDashboardDivision(e.target.value)}>
                <option value="all">All divisions</option>
                {db.divisions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          {unassignedLeaderRecords.length > 0 && (
            <Panel
              title={`⚠️ Action Required: ${fmt(totalUnassignedLeaders)} Unit Leaders Unassigned to Sections`}
              subtitle={`${unassignedLeaderRecords.length} school registration(s) have unit leaders recorded without a section assignment. Click "Assign Sections" below to categorize them.`}
              action={
                <button
                  type="button"
                  className="btn gold"
                  style={{ padding: '6px 12px', fontSize: '11px' }}
                  onClick={() => {
                    setFilterUnassignedOnly(true);
                    setPage('registrations');
                  }}
                >
                  View in Registrations ({unassignedLeaderRecords.length})
                </button>
              }
            >
              <div className="table-wrap" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>School / Institution</th>
                      <th>Receipt / Invoice</th>
                      <th>Division</th>
                      <th>District</th>
                      <th>Date</th>
                      <th>Total Leaders</th>
                      <th>Assigned</th>
                      <th>Unassigned</th>
                      <th className="no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unassignedLeaderRecords.map(r => (
                      <tr key={r.id}>
                        <td><b>{r.school}</b></td>
                        <td>{r.receipt}</td>
                        <td>{r.division}</td>
                        <td>{r.district}</td>
                        <td>{r.date}</td>
                        <td>{fmt(r.totalLeaders)}</td>
                        <td>{fmt(r.assigned)}</td>
                        <td>
                          <span style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '11px',
                            display: 'inline-block'
                          }}>
                            {fmt(r.unassigned)} unassigned
                          </span>
                        </td>
                        <td className="no-print">
                          <button
                            type="button"
                            className="btn gold"
                            style={{ padding: '4px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}
                            onClick={() => editRecord(r)}
                          >
                            <Pencil size={12}/> Assign Sections
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
          <div className="metric-grid">
            <Metric label="Total Registered Scouts" value={fmt(totals.scouts)} note={periodLabel} icon={Users}/>
            <MetricWithGender label="Unit Leaders" total={fmt(totals.leaders)} male={fmt(totals.leaderMale)} female={fmt(totals.leaderFemale)} note="Registered leaders" icon={UserRound}/>
            <MetricWithGender label="Institutional Heads" total={fmt(totals.heads)} male={fmt(totals.headMale)} female={fmt(totals.headFemale)} note="Registered heads" icon={School}/>
            <Metric label="School Registrations" value={fmt(totals.entries)} note="Encoded submissions" icon={School}/>
            <Metric label="Total Collections" value={money(totals.paid)} note="Actual recorded payments" icon={PhilippinePeso}/>
          </div>
          {validationIssues.length > 0 && <Panel title="Data validation issues" subtitle="These registrations have missing or mismatched gender totals."><div className="table-wrap"><table><thead><tr><th>School</th><th>Receipt</th><th>Division</th><th>District</th><th>Scouts</th><th>Leader count</th><th>Head count</th></tr></thead><tbody>{validationIssues.map(issue => <tr key={issue.id}><td>{issue.school}</td><td>{issue.receipt}</td><td>{issue.division}</td><td>{issue.district}</td><td>{issue.scoutMismatch ? `${issue.scoutActual} vs ${issue.scoutExpected}` : 'OK'}</td><td>{issue.leaderMismatch ? `${issue.leaderActual} vs ${issue.leaderExpected}` : 'OK'}</td><td>{issue.headMismatch ? `${issue.headActual} vs ${issue.headExpected}` : 'OK'}</td></tr>)}</tbody></table></div></Panel>}
          <div className="two-col">
            <Panel title="Scouts by Division" subtitle="Share of registered scouts"><ChartPie data={scoutByDivision} onSelect={openChartDetail}/></Panel>
            <Panel title="Unit Leaders by Division" subtitle="Share of registered Unit Leaders"><ChartPie data={leadersByDivision} onSelect={openChartDetail}/></Panel>
          </div>
          <div className="two-col">
            <Panel title="Male to Female Scouts" subtitle="Gender breakdown for all scouts"><ChartPie data={genderData} onSelect={openChartDetail}/></Panel>
            <Panel title="Unit Leaders & Institutional Heads by Gender" subtitle="Breakdown of registered leader and head counts"><div className="two-col" style={{ gridTemplateColumns: '1fr 1fr' }}><ChartPie data={unitLeaderGenderData} onSelect={openChartDetail}/><ChartPie data={institutionalHeadGenderData} onSelect={openChartDetail}/></div></Panel>
          </div>
          <div className="two-col">
            <Panel title="Scout Registration Breakdown" subtitle="Council-wide totals by section">
              <div className="chart-box tall">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectionData} margin={{ top: 22, right: 10, left: 0, bottom: 15 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="name" tick={{fontSize:11}}/>
                    <YAxis allowDecimals={false}/>
                    <Tooltip formatter={v => fmt(v)}/>
                    <Bar dataKey="total" radius={[5,5,0,0]} onClick={item => openChartDetail(item)}>
                      {sectionData.map((entry, index) => <Cell key={entry.name} fill={SECTION_COLOR_LIST[index] || '#174a78'} />)}
                      <LabelList dataKey="total" position="top" formatter={v => (v > 0 ? fmt(v) : '0')} style={{ fill: '#173b5d', fontSize: 11, fontWeight: 700 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel
              title="Unit Leaders Breakdown by Section"
              subtitle="Council-wide leaders by section role"
              action={
                <div style={{ display: 'inline-flex', gap: '3px', background: '#edf3f8', padding: '2px', borderRadius: '14px' }}>
                  <button
                    type="button"
                    className={`chip ${leaderChartType === 'bar' ? 'selected' : ''}`}
                    style={{ padding: '3px 8px', fontSize: '10px', border: 0, margin: 0 }}
                    onClick={() => setLeaderChartType('bar')}
                  >
                    Bar
                  </button>
                  <button
                    type="button"
                    className={`chip ${leaderChartType === 'pie' ? 'selected' : ''}`}
                    style={{ padding: '3px 8px', fontSize: '10px', border: 0, margin: 0 }}
                    onClick={() => setLeaderChartType('pie')}
                  >
                    Donut
                  </button>
                </div>
              }
            >
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {leaderSectionData.map(item => (
                  <div
                    key={item.name}
                    onClick={() => openChartDetail(item)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      background: '#f4f7fb',
                      border: '1px solid #e1e8f0',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                    title="Click to view details"
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color }} />
                    <span style={{ color: '#4a6075' }}>{item.name}:</span>
                    <b style={{ color: '#102d4f' }}>{fmt(item.total)}</b>
                  </div>
                ))}
              </div>
              {leaderChartType === 'bar' ? (
                <div className="chart-box tall">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leaderSectionData} margin={{ top: 22, right: 10, left: 0, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip formatter={v => `${fmt(v)} Leaders`} />
                      <Bar dataKey="total" radius={[5, 5, 0, 0]} onClick={item => openChartDetail(item)}>
                        {leaderSectionData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                        <LabelList
                          dataKey="total"
                          position="top"
                          formatter={v => (v > 0 ? fmt(v) : '0')}
                          style={{ fill: '#173b5d', fontSize: 11, fontWeight: 700 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartPie data={leaderSectionData} onSelect={openChartDetail} />
              )}
            </Panel>
          </div>
          <div className="two-col">
            <Panel title="Institutional Heads by Division" subtitle="Share of registered heads"><ChartPie data={db.divisions.map(name => { const recordsForDivision = dashboardRecords.filter(r => r.division === name); return { name: name.replace(' Division', ''), value: recordsForDivision.reduce((s, r) => s + Number(r.heads || 0), 0), records: recordsForDivision }; })} onSelect={openChartDetail}/></Panel>
            <Panel
              title="Registration Trend"
              subtitle={`${trendView === 'daily' ? 'Scouts registered by date' : 'Scouts registered by month'} · ${periodLabel}`}
              action={
                <div style={{ display: 'inline-flex', gap: '3px', background: '#edf3f8', padding: '2px', borderRadius: '14px' }}>
                  <button
                    type="button"
                    className={`chip ${trendView === 'monthly' ? 'selected' : ''}`}
                    style={{ padding: '3px 8px', fontSize: '10px', border: 0, margin: 0 }}
                    onClick={() => setTrendView('monthly')}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    className={`chip ${trendView === 'daily' ? 'selected' : ''}`}
                    style={{ padding: '3px 8px', fontSize: '10px', border: 0, margin: 0 }}
                    onClick={() => setTrendView('daily')}
                  >
                    Daily
                  </button>
                </div>
              }
            >
              {trendData.length === 0 ? <EmptyChart /> : (
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3"/>
                      <XAxis dataKey="period" tick={{fontSize:10}}/>
                      <YAxis allowDecimals={false}/>
                      <Tooltip formatter={v => fmt(v)}/>
                      <Line
                        type="monotone"
                        dataKey="scouts"
                        stroke="#174a78"
                        strokeWidth={3}
                        dot={{fill:'#e4ad37',r:4}}
                        activeDot={{ r: 6, cursor: 'pointer', onClick: (_, payload) => openChartDetail(payload?.payload) }}
                        onClick={item => openChartDetail(item)}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>
          <Panel title="Division Drill-down" subtitle="Select a division to view district-level scout and leader distribution.">
            <div className="chip-row">{db.divisions.map(d => <button key={d} className={`chip ${selectedDivision === d ? 'selected' : ''}`} onClick={() => { setDashboardDivision(d); setSelectedDivision(d); }}>{d}</button>)}</div>
            <div className="two-col drill-charts"><Panel title={`${selectedDivision} — Scouts by District`}><ChartPie data={districtScouts} onSelect={openChartDetail}/></Panel><Panel title={`${selectedDivision} — Unit Leaders by District`}><ChartPie data={districtLeaders} onSelect={openChartDetail}/></Panel></div>
          </Panel>
        </section>}

        {page === 'form' && <section className="page">
          <div className="page-heading"><div><h1>{editingId ? 'Edit Registration' : 'Add Registration'}</h1><p>Encode one school's registration submission.</p></div></div>
          <form className="form-panel" onSubmit={saveRecord}>
            <FormSection title="1. Registration Information">
              <Field label="Division *"><select required value={form.division} onChange={e => setField('division',e.target.value)}>{db.divisions.map(d => <option key={d}>{d}</option>)}</select></Field>
              <Field label="District *"><input required list="district-list" value={form.district} onChange={e => setField('district',e.target.value)} placeholder="Enter or select district"/><datalist id="district-list">{districtOptions.map(d => <option key={d} value={d}/>)}</datalist></Field>
              <Field label="School / Institution *"><input required list="school-list" value={form.school} onChange={e => setField('school',e.target.value)} placeholder="School name"/><datalist id="school-list">{schoolOptions.map(s => <option key={s} value={s}/>)}</datalist></Field>
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
            <FormSection title="3. Unit Leaders & Institutional Heads">
              {Number(form.leaders || 0) > formLeaderSections && (
                <div style={{
                  gridColumn: '1 / -1',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '13px', color: '#92400e' }}>
                    ⚠️ <strong>{Number(form.leaders || 0) - formLeaderSections} Unit Leader{Number(form.leaders || 0) - formLeaderSections > 1 ? 's' : ''} not yet assigned to a section.</strong> Please enter how many belong to Langkay, Kawan, Troop, Outfit, or Circle below.
                  </div>
                  <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 700 }}>
                    {formLeaderSections} of {form.leaders} assigned
                  </span>
                </div>
              )}
              {LEADER_SECTIONS.map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    type="number"
                    min="0"
                    value={form[key]}
                    onChange={e => {
                      const val = e.target.value;
                      setForm(prev => {
                        const next = { ...prev, [key]: val };
                        const sum = LEADER_SECTIONS.reduce((s, [k]) => s + Number(k === key ? val : (next[k] || 0)), 0);
                        const currentLeaders = Number(prev.leaders || 0);
                        const newLeaders = sum > currentLeaders || currentLeaders === 0 ? sum : currentLeaders;
                        return { ...next, leaders: newLeaders };
                      });
                    }}
                  />
                </Field>
              ))}
              <Field label="Total Unit Leaders">
                <input
                  type="number"
                  min="0"
                  value={form.leaders}
                  onChange={e => setField('leaders', e.target.value)}
                  title="Total unit leaders recorded"
                />
              </Field>
              <Field label="Male Unit Leaders (all sections)"><input type="number" min="0" value={form.leaderMale} onChange={e => setField('leaderMale',e.target.value)}/></Field>
              <Field label="Female Unit Leaders (all sections)"><input type="number" min="0" value={form.leaderFemale} onChange={e => setField('leaderFemale',e.target.value)}/></Field>
              <Field label="Unit Leader Gender Check"><input readOnly value={Number(form.leaderMale) + Number(form.leaderFemale) === Number(form.leaders || 0) ? 'Matched' : `Difference: ${Math.abs(Number(form.leaders || 0)-Number(form.leaderMale)-Number(form.leaderFemale))}`}/></Field>
              <Field label="Number of Institutional Heads"><input type="number" min="0" value={form.heads} onChange={e => setField('heads',e.target.value)}/></Field>
              <Field label="Male Institutional Heads"><input type="number" min="0" value={form.headMale} onChange={e => setField('headMale',e.target.value)}/></Field>
              <Field label="Female Institutional Heads"><input type="number" min="0" value={form.headFemale} onChange={e => setField('headFemale',e.target.value)}/></Field>
              <Field label="Institutional Head Gender Check"><input readOnly value={Number(form.headMale) + Number(form.headFemale) === Number(form.heads || 0) ? 'Matched' : `Difference: ${Math.abs(Number(form.heads || 0)-Number(form.headMale)-Number(form.headFemale))}`}/></Field>
            </FormSection>
            <FormSection title="4. Fees and Payment">
              <Field label="Fee per Scout (₱)"><input type="number" min="0" step="0.01" value={form.scoutFee} onChange={e => setField('scoutFee',e.target.value)}/></Field>
              <Field label="Fee per Unit Leader (₱)"><input type="number" min="0" step="0.01" value={form.leaderFee} onChange={e => setField('leaderFee',e.target.value)}/></Field>
              <Field label="Fee per Institutional Head (₱)"><input type="number" min="0" step="0.01" value={form.institutionFee} onChange={e => setField('institutionFee',e.target.value)}/></Field>
              <Field label="Calculated Expected Amount (₱)"><input readOnly value={money(expected)}/></Field>
              <Field label="Actual Amount Paid (₱) *"><input required type="number" min="0" step="0.01" value={form.paid} onChange={e => setField('paid',e.target.value)}/></Field>
              <Field label="Payment Notes"><input value={form.paymentNotes} onChange={e => setField('paymentNotes',e.target.value)} placeholder="Optional notes"/></Field>
            </FormSection>
            <p className="form-hint">Expected amount = (total scouts × fee per scout) + (Unit Leaders × unit leader fee) + (Institutional Heads × institutional head fee). Actual amount paid is stored separately for partial payments or adjustments.</p>
            <div className="form-actions"><button className="btn gold" type="submit">Save Registration</button><button className="btn outline" type="button" onClick={() => {resetForm();setPage('registrations')}}>Cancel</button></div>
          </form>
        </section>}

        {page === 'registrations' && <section className="page">
          <div className="page-heading"><div><h1>Registration Records</h1><p>Search, edit, and manage encoded school registrations.</p></div><button className="btn gold" onClick={() => {resetForm();setPage('form')}}><PlusCircle size={16}/> Add Registration</button></div>
          <div className="toolbar">
            <div className="search-box">
              <Search size={16}/>
              <input placeholder="Search school, district, receipt..." value={query} onChange={e => setQuery(e.target.value)}/>
            </div>
            <select className="control" value={divisionFilter} onChange={e => setDivisionFilter(e.target.value)}>
              <option value="">All divisions</option>
              {db.divisions.map(d => <option key={d}>{d}</option>)}
            </select>
            {unassignedLeaderRecords.length > 0 && (
              <button
                type="button"
                className={`chip ${filterUnassignedOnly ? 'selected' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: filterUnassignedOnly ? '#92400e' : '#fffbeb',
                  color: filterUnassignedOnly ? '#fff' : '#92400e',
                  borderColor: '#fde68a',
                  fontWeight: 700
                }}
                onClick={() => setFilterUnassignedOnly(!filterUnassignedOnly)}
              >
                <span>⚠️</span>
                <span>Unassigned Sections ({unassignedLeaderRecords.length})</span>
              </button>
            )}
            <button className="btn outline" onClick={exportCsv}><Download size={15}/> Export CSV</button>
          </div>
          <div className="table-wrap"><table><thead><tr><th>Date</th><th>Division</th><th>District</th><th>School</th><th>Scouts</th><th>Leaders</th><th>Receipt / Invoice</th><th>Paid</th><th className="no-print">Actions</th></tr></thead><tbody>
            {filteredRecords.length ? filteredRecords.map(r => <tr key={r.id}><td>{r.date}</td><td>{r.division}</td><td>{r.district}</td><td><b>{r.school}</b></td><td>{fmt(scoutsOf(r))}</td><td>{fmt(r.leaders)}{Number(r.leaders || 0) > leaderSectionsOf(r) && (
              <button
                type="button"
                style={{
                  marginLeft: '6px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title={`${Number(r.leaders || 0) - leaderSectionsOf(r)} unassigned unit leaders. Click to assign sections.`}
                onClick={(e) => { e.stopPropagation(); editRecord(r); }}
              >
                ⚠️ Assign ({Number(r.leaders || 0) - leaderSectionsOf(r)})
              </button>
            )}</td><td>{r.receipt}</td><td>{money(r.paid)}</td><td className="actions-cell no-print"><button className="table-action" onClick={() => editRecord(r)} aria-label="Edit"><Pencil size={15}/></button><button className="table-action delete" onClick={() => deleteRecord(r.id)} aria-label="Delete"><Trash2 size={15}/></button></td></tr>) : <tr><td colSpan="9" className="empty-row">No registration records found.</td></tr>}
          </tbody></table></div>
        </section>}

        {page === 'reports' && <section className="page">
          <div className="page-heading no-print">
            <div>
              <h1>Reports & Print Center</h1>
              <p>Printable council registration, collection summaries, and monthly membership transmittal.</p>
            </div>
            <div className="header-controls">
              <div className="chip-row" style={{ margin: 0 }}>
                <button
                  type="button"
                  className={`chip ${reportTab === 'summary' ? 'selected' : ''}`}
                  onClick={() => setReportTab('summary')}
                >
                  Council Summary
                </button>
                <button
                  type="button"
                  className={`chip ${reportTab === 'transmittal' ? 'selected' : ''}`}
                  onClick={() => setReportTab('transmittal')}
                >
                  Membership Transmittal
                </button>
                <button
                  type="button"
                  className={`chip ${reportTab === 'mmrr' ? 'selected' : ''}`}
                  onClick={() => setReportTab('mmrr')}
                >
                  MMRR
                </button>
              </div>
              {reportTab === 'summary' ? (
                <button type="button" className="btn gold" onClick={printPage}><Printer size={16}/> Print Report</button>
              ) : reportTab === 'transmittal' ? (
                <button type="button" className="btn gold" onClick={printPage}><Printer size={16}/> Print Membership Transmittal</button>
              ) : (
                <button type="button" className="btn gold" onClick={printPage}><Printer size={16}/> Print MMRR</button>
              )}
            </div>
          </div>

          {reportTab === 'summary' && <>
            <div className="notice no-print">Reports are generated from records saved in this browser. Use Backup regularly to protect your data.</div>
            <div className="metric-grid"><Metric label="Total Scouts" value={fmt(totalsOf(records).scouts)} note="All encoded years" icon={Users}/><MetricWithGender label="Unit Leaders" total={fmt(totalsOf(records).leaders)} male={fmt(totalsOf(records).leaderMale)} female={fmt(totalsOf(records).leaderFemale)} note="All divisions" icon={UserRound}/><MetricWithGender label="Institutional Heads" total={fmt(totalsOf(records).heads)} male={fmt(totalsOf(records).headMale)} female={fmt(totalsOf(records).headFemale)} note="All divisions" icon={School}/><Metric label="Registrations" value={fmt(records.length)} note="School submissions" icon={School}/><Metric label="Collections" value={money(totalsOf(records).paid)} note="Actual recorded payments" icon={PhilippinePeso}/></div>
            <div className="two-col"><Panel title="Scouts by Division"><ChartPie data={scoutByDivision}/></Panel><Panel title="Unit Leaders by Division"><ChartPie data={leadersByDivision}/></Panel></div>
            <div className="two-col">
              <Panel title="Scout Section Summary"><div className="table-wrap"><table><thead><tr><th>Scout Section</th><th>Total Registered</th></tr></thead><tbody>{SECTIONS.map(([k,label]) => <tr key={k}><td>{label}</td><td>{fmt(totalsOf(records)[k])}</td></tr>)}<tr><th>Total Scouts</th><th>{fmt(totalsOf(records).scouts)}</th></tr></tbody></table></div></Panel>
              <Panel title="Unit Leader Section Summary"><div className="table-wrap"><table><thead><tr><th>Leader Role / Section</th><th>Total Registered</th></tr></thead><tbody>{LEADER_SECTIONS.map(([k,label]) => <tr key={k}><td>{label}</td><td>{fmt(totalsOf(records)[k])}</td></tr>)}<tr><th>Total Unit Leaders</th><th>{fmt(totalsOf(records).leaders)}</th></tr></tbody></table></div></Panel>
            </div>
            <Panel title="Division Summary"><DivisionSummary divisions={db.divisions} records={records}/></Panel>
          </>}

          {reportTab === 'transmittal' && (() => {
            const transmittalIssueRecords = records
              .filter(r => (r.date || '').startsWith(transmittalPeriodKey))
              .map(r => {
                const issues = [];
                const scoutTotal = scoutsOf(r);
                const scoutMale = Number(r.male || 0);
                const scoutFemale = Number(r.female || 0);
                const leaderTotal = Number(r.leaders || 0);
                const leaderMale = Number(r.leaderMale || 0);
                const leaderFemale = Number(r.leaderFemale || 0);
                const leaderAssigned = leaderSectionsOf(r);
                const headTotal = Number(r.heads || 0);
                const headMale = Number(r.headMale || 0);
                const headFemale = Number(r.headFemale || 0);

                if (scoutMale + scoutFemale !== scoutTotal) {
                  issues.push(scoutMale === 0 && scoutFemale === 0 ? 'Scout gender not recorded' : 'Scout gender counts need review');
                }
                if (leaderAssigned < leaderTotal) {
                  issues.push(`${leaderTotal - leaderAssigned} unit leader(s) need section assignment`);
                }
                if (leaderMale + leaderFemale !== leaderTotal) {
                  issues.push(leaderMale === 0 && leaderFemale === 0 ? 'Leader gender not recorded' : 'Leader gender counts need review');
                }
                if (headMale + headFemale !== headTotal) {
                  issues.push(headMale === 0 && headFemale === 0 ? 'Institutional head gender not recorded' : 'Institutional head gender counts need review');
                }

                return issues.length > 0 ? { ...r, issues } : null;
              })
              .filter(Boolean);

            return <>
            <Panel
              className="no-print"
              title="Monthly Membership Transmittal Settings"
              subtitle="Choose the transmittal month, year, letter date, and optional SVG e-signature. Counts auto-fill from matching monthly records and can be adjusted in the table before printing."
            >
              <div className="transmittal-controls">
                <label className="field">
                  <span>For the Month of</span>
                  <select className="control" value={transmittalMonth} onChange={e => setTransmittalMonth(e.target.value)}>
                    {monthOptions.filter(m => m !== 'all').map(m => (
                      <option key={m} value={m}>
                        {new Date(`2026-${m}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Year</span>
                  <select className="control" value={transmittalYear} onChange={e => setTransmittalYear(e.target.value)}>
                    {transmittalYearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Transmittal Date</span>
                  <input type="date" value={transmittalDate} onChange={e => setTransmittalDate(e.target.value)} />
                </label>
                <div className="transmittal-sig-actions">
                  <label className="btn outline file-button">
                    <Upload size={15}/> {transmittalSignature ? 'Replace SVG Signature' : 'Upload SVG Signature'}
                    <input type="file" accept=".svg,image/svg+xml" onChange={handleSignatureUpload} />
                  </label>
                  {transmittalSignature && (
                    <button type="button" className="btn outline" onClick={clearTransmittalSignature}>
                      Remove Signature
                    </button>
                  )}
                  {transmittalOverrides[transmittalPeriodKey] && Object.keys(transmittalOverrides[transmittalPeriodKey]).length > 0 && (
                    <button type="button" className="btn outline" onClick={resetTransmittalOverrides}>
                      Reset Manual Edits
                    </button>
                  )}
                </div>
              </div>
              {transmittalRows.some(row => row.hasMixedOrMissingGender) && (
                <div className="notice" style={{ marginTop: '12px' }}>
                  <strong>Per-section gender input note:</strong> Registration records store Male/Female scout totals across all sections combined. For rows with mixed or unrecorded scout genders below, enter the M/F breakdown per section directly in the table before printing:
                  <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                    {transmittalRows.filter(row => row.hasMixedOrMissingGender).map(row => (
                      <li key={row.key}>
                        <b>{row.label}:</b>{' '}
                        {SECTIONS.filter(([secKey]) => row.sectionTotals[secKey] > 0).map(([secKey, label]) => `${label.replace(' Scouts', '')}: ${fmt(row.sectionTotals[secKey])}`).join(', ')}
                        {(row.mixedMale > 0 || row.mixedFemale > 0) ? ` (Mixed records — Male: ${fmt(row.mixedMale)}, Female: ${fmt(row.mixedFemale)})` : ''}
                        {row.unrecordedGenderScouts > 0 ? ` (${fmt(row.unrecordedGenderScouts)} without gender recorded)` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {transmittalIssueRecords.length > 0 && (
                <div className="mmrr-consolidation-list">
                  <div className="mmrr-consolidation-heading">
                    <strong>Registration entries needing consolidation</strong>
                    <span>{transmittalIssueRecords.length} {transmittalIssueRecords.length === 1 ? 'entry' : 'entries'}</span>
                  </div>
                  {transmittalIssueRecords.map(r => (
                    <button
                      type="button"
                      className="mmrr-consolidation-entry"
                      key={r.id}
                      onClick={() => editRecord(r)}
                      title="Open and edit this registration entry"
                    >
                      <span className="mmrr-consolidation-entry-main">
                        <strong>{r.school || 'Unnamed institution'}</strong>
                        <span>{r.division || '—'} · Receipt {r.receipt || '—'}</span>
                      </span>
                      <span className="mmrr-consolidation-issues">
                        {r.issues.join(' · ')}
                      </span>
                      <span className="mmrr-consolidation-action">
                        <Pencil size={13} /> Edit entry
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Panel>

            <div className="transmittal-sheet">
              <div className="transmittal-header">
                <div>BOY SCOUTS OF THE PHILIPPINES</div>
                <div>NORTHEASTERN MINDANAO REGION</div>
                <div className="transmittal-council">AGUSAN COUNCIL</div>
                <div className="transmittal-title">MEMBERSHIP TRANSMITTAL</div>
                <div className="transmittal-period">
                  for the month of{' '}
                  <span className="transmittal-month-underline">
                    {new Date(`${transmittalYear}-${transmittalMonth}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long' })}
                  </span>{' '}
                  {transmittalYear}
                </div>
              </div>

              <div className="transmittal-date">{formatLongDate(transmittalDate)}</div>

              <div className="transmittal-addressee">
                <div><b>ROSCHELLE JOHN BENEDICT O. MEDELLIN</b></div>
                <div>RYDO III (Assigned In Charge)</div>
                <div>Northeastern Mindanao Regional Coordination Office</div>
              </div>

              <div className="transmittal-salutation">Sir:</div>
              <p className="transmittal-intro">
                Respectfully submitted herewith are the Membership Forms of this Council for the above-stated period, summarized as follows:
              </p>

              <div className="transmittal-table-wrap">
                <table className="transmittal-table">
                  <thead>
                    <tr>
                      <th rowSpan={2} className="col-no">NO.</th>
                      <th rowSpan={2} className="col-division">SCHOOLS DIVISION/<br/>COMMUNITY</th>
                      {TRANSMITTAL_SECTIONS.map(([, label, bg, color]) => (
                        <th key={label} colSpan={2} className="col-section" style={{ backgroundColor: bg, color }}>
                          {label}
                        </th>
                      ))}
                      <th rowSpan={2} className="col-total-scouts">TOTAL<br/>SCOUTS</th>
                      <th colSpan={2} className="col-ais">AIS</th>
                      <th rowSpan={2} className="col-total-reg">TOTAL<br/>REGISTERED</th>
                    </tr>
                    <tr>
                      {TRANSMITTAL_SECTIONS.map(([, label]) => (
                        <React.Fragment key={`${label}-mf`}>
                          <th className="col-mf">M</th>
                          <th className="col-mf">F</th>
                        </React.Fragment>
                      ))}
                      <th className="col-mf">M</th>
                      <th className="col-mf">F</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transmittalRows.map(row => (
                      <tr key={row.key}>
                        <td className="text-center">{row.no}</td>
                        <td className="division-cell">{row.label}</td>
                        {TRANSMITTAL_SECTIONS.map(([secKey]) => (
                          <React.Fragment key={`${row.key}-${secKey}`}>
                            <td className={`num-cell ${row.needsSplit[secKey] ? 'needs-input' : ''}`}>
                              <input
                                type="number"
                                min="0"
                                className="transmittal-cell-input"
                                aria-label={`${row.label} ${secKey} male`}
                                value={row.displayVal(`${secKey}M`, secKey)}
                                placeholder={row.needsSplit[secKey] ? '?' : '0'}
                                onChange={e => updateTransmittalCell(row.key, `${secKey}M`, e.target.value)}
                              />
                            </td>
                            <td className={`num-cell ${row.needsSplit[secKey] ? 'needs-input' : ''}`}>
                              <input
                                type="number"
                                min="0"
                                className="transmittal-cell-input"
                                aria-label={`${row.label} ${secKey} female`}
                                value={row.displayVal(`${secKey}F`, secKey)}
                                placeholder={row.needsSplit[secKey] ? '?' : '0'}
                                onChange={e => updateTransmittalCell(row.key, `${secKey}F`, e.target.value)}
                              />
                            </td>
                          </React.Fragment>
                        ))}
                        <td className="text-center total-col">{fmt(row.totalScouts)}</td>
                        <td className="num-cell">
                          <input
                            type="number"
                            min="0"
                            className="transmittal-cell-input"
                            aria-label={`${row.label} AIS male`}
                            value={row.displayVal('aisM')}
                            onChange={e => updateTransmittalCell(row.key, 'aisM', e.target.value)}
                          />
                        </td>
                        <td className="num-cell">
                          <input
                            type="number"
                            min="0"
                            className="transmittal-cell-input"
                            aria-label={`${row.label} AIS female`}
                            value={row.displayVal('aisF')}
                            onChange={e => updateTransmittalCell(row.key, 'aisF', e.target.value)}
                          />
                        </td>
                        <td className="text-center total-col">{fmt(row.totalRegistered)}</td>
                      </tr>
                    ))}
                    <tr className="transmittal-total-row">
                      <td colSpan={2} className="text-center">TOTAL</td>
                      {TRANSMITTAL_SECTIONS.map(([secKey]) => (
                        <React.Fragment key={`total-${secKey}`}>
                          <td className="text-center">{fmt(transmittalTotals[`${secKey}M`])}</td>
                          <td className="text-center">{fmt(transmittalTotals[`${secKey}F`])}</td>
                        </React.Fragment>
                      ))}
                      <td className="text-center">{fmt(transmittalTotals.totalScouts)}</td>
                      <td className="text-center">{fmt(transmittalTotals.aisM)}</td>
                      <td className="text-center">{fmt(transmittalTotals.aisF)}</td>
                      <td className="text-center">{fmt(transmittalTotals.totalRegistered)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="transmittal-closing-note">
                Attached herewith is the MRR and other required membership documents for your review and recording.
              </p>

              <div className="transmittal-signature-block">
                <div className="transmittal-respectfully">Respectfully yours,</div>
                <div className="transmittal-signature-space">
                  {transmittalSignatureUrl && (
                    <img src={transmittalSignatureUrl} alt="Brando E. Faelnar e-signature" className="transmittal-signature-img" />
                  )}
                </div>
                <div className="transmittal-signatory-name">BRANDO E. FAELNAR</div>
                <div className="transmittal-signatory-title">Acting Council Scout Executive</div>
              </div>
            </div>
            </>;
          })()}

          {reportTab === 'mmrr' && (() => {
            const perf = mmrrPerf[mmrrYear] || {};
            const calcPct = (actualVal, targetVal, overrideVal) => {
              if (overrideVal !== undefined && overrideVal !== '') return overrideVal;
              const t = Number(targetVal);
              const a = Number(actualVal);
              if (t > 0 && actualVal !== undefined && actualVal !== '') {
                return `${((a / t) * 100).toFixed(2)}%`;
              }
              return '';
            };
            const mmrrMonthLabel = `${MMRR_SHORT_MONTHS[Number(mmrrMonth) - 1]}-${mmrrYear.slice(-2)}`;
            const hasMmrrOverrides = mmrrOverrides[mmrrPeriodKey] && Object.keys(mmrrOverrides[mmrrPeriodKey]).length > 0;
            const mmrrIssueRecords = records
              .filter(r => (r.date || '').startsWith(mmrrPeriodKey))
              .map(r => {
                const issues = [];
                const scoutTotal = scoutsOf(r);
                const scoutMale = Number(r.male || 0);
                const scoutFemale = Number(r.female || 0);
                const leaderTotal = Number(r.leaders || 0);
                const leaderMale = Number(r.leaderMale || 0);
                const leaderFemale = Number(r.leaderFemale || 0);
                const leaderAssigned = leaderSectionsOf(r);
                const headTotal = Number(r.heads || 0);
                const headMale = Number(r.headMale || 0);
                const headFemale = Number(r.headFemale || 0);

                if (scoutMale + scoutFemale !== scoutTotal) {
                  issues.push(scoutMale === 0 && scoutFemale === 0 ? 'Scout gender not recorded' : 'Scout gender counts need review');
                }
                if (leaderAssigned < leaderTotal) {
                  issues.push(`${leaderTotal - leaderAssigned} unit leader(s) need section assignment`);
                }
                if (leaderMale + leaderFemale !== leaderTotal) {
                  issues.push(leaderMale === 0 && leaderFemale === 0 ? 'Leader gender not recorded' : 'Leader gender counts need review');
                }
                if (headMale + headFemale !== headTotal) {
                  issues.push(headMale === 0 && headFemale === 0 ? 'Institutional head gender not recorded' : 'Institutional head gender counts need review');
                }

                return issues.length > 0 ? { ...r, issues } : null;
              })
              .filter(Boolean);
            return <>
              <Panel
                className="no-print"
                title="Monthly Membership Registration Report (MMRR) Settings"
                subtitle="Select the report month and year, upload SVG signatures with signed dates, and review or adjust counts before printing. Standard fees (₱50 / ₱60 / ₱100) are fixed."
              >
                <div className="mmrr-controls-grid">
                  <label className="field">
                    <span>Month of</span>
                    <select className="control" value={mmrrMonth} onChange={e => setMmrrMonth(e.target.value)}>
                      {monthOptions.filter(m => m !== 'all').map(m => (
                        <option key={m} value={m}>
                          {new Date(`2026-${m}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Year</span>
                    <select className="control" value={mmrrYear} onChange={e => setMmrrYear(e.target.value)}>
                      {transmittalYearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>Prepared by Date Signed</span>
                    <input type="date" value={mmrrPreparedDate} onChange={e => setMmrrPreparedDate(e.target.value)} />
                  </label>
                  <label className="field">
                    <span>Certified Correct Date Signed</span>
                    <input type="date" value={mmrrCertifiedDate} onChange={e => setMmrrCertifiedDate(e.target.value)} />
                  </label>
                </div>
                <div className="mmrr-sig-toolbar">
                  <div className="mmrr-sig-group">
                    <span className="mmrr-sig-label">Registration Officer (SVG):</span>
                    <input
                      type="text"
                      className="control mmrr-name-input"
                      aria-label="Registration Officer name"
                      placeholder="Registration Officer name"
                      value={mmrrPreparedName}
                      onChange={e => {
                        setMmrrPreparedName(e.target.value);
                        try {
                          localStorage.setItem(MMRR_PREPARED_NAME_KEY, e.target.value);
                        } catch {}
                      }}
                    />
                    <label className="btn outline file-button">
                      <Upload size={15}/> {mmrrPreparedSig ? 'Replace SVG' : 'Upload SVG'}
                      <input type="file" accept=".svg,image/svg+xml" onChange={e => handleSvgUpload(e, setMmrrPreparedSig, MMRR_PREPARED_SIG_KEY)} />
                    </label>
                    {mmrrPreparedSig && (
                      <button type="button" className="btn outline" onClick={() => clearSvgSignature(setMmrrPreparedSig, MMRR_PREPARED_SIG_KEY)}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="mmrr-sig-group">
                    <span className="mmrr-sig-label">Council Scout Executive (SVG):</span>
                    <input
                      type="text"
                      className="control mmrr-name-input"
                      aria-label="Council Scout Executive name"
                      placeholder="Council Scout Executive name"
                      value={mmrrCertifiedName}
                      onChange={e => {
                        setMmrrCertifiedName(e.target.value);
                        try {
                          localStorage.setItem(MMRR_CERTIFIED_NAME_KEY, e.target.value);
                        } catch {}
                      }}
                    />
                    <label className="btn outline file-button">
                      <Upload size={15}/> {mmrrCertifiedSig ? 'Replace SVG' : 'Upload SVG'}
                      <input type="file" accept=".svg,image/svg+xml" onChange={e => handleSvgUpload(e, setMmrrCertifiedSig, MMRR_CERTIFIED_SIG_KEY)} />
                    </label>
                    {mmrrCertifiedSig && (
                      <button type="button" className="btn outline" onClick={() => clearSvgSignature(setMmrrCertifiedSig, MMRR_CERTIFIED_SIG_KEY)}>
                        Remove
                      </button>
                    )}
                  </div>
                  {hasMmrrOverrides && (
                    <button type="button" className="btn outline" onClick={resetMmrrOverrides}>
                      Reset Manual Edits
                    </button>
                  )}
                </div>

                {(mmrrData.mixedScoutNote || mmrrData.mixedLeaderNote) && (
                  <div className="notice" style={{ marginTop: '12px' }}>
                    <strong>Gender breakdown note for {mmrrMonthLabel}:</strong>
                    <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                      {mmrrData.mixedScoutNote && (
                        <li>
                          <b>Scouts:</b> Mixed/unrecorded gender records exist for this month (
                          {mmrrData.mixedScoutNote.male > 0 || mmrrData.mixedScoutNote.female > 0
                            ? `Mixed records total Male: ${fmt(mmrrData.mixedScoutNote.male)}, Female: ${fmt(mmrrData.mixedScoutNote.female)}`
                            : ''}
                          {mmrrData.mixedScoutNote.unrecorded > 0
                            ? `${mmrrData.mixedScoutNote.male > 0 || mmrrData.mixedScoutNote.female > 0 ? '; ' : ''}${fmt(mmrrData.mixedScoutNote.unrecorded)} without gender`
                            : ''}
                          ). Enter Male/Female counts per section directly in the table below.
                        </li>
                      )}
                      {mmrrData.mixedLeaderNote && (
                        <li>
                          <b>Unit Leaders:</b>{' '}
                          {mmrrData.mixedLeaderNote.male > 0 || mmrrData.mixedLeaderNote.female > 0
                            ? `Mixed records total Male: ${fmt(mmrrData.mixedLeaderNote.male)}, Female: ${fmt(mmrrData.mixedLeaderNote.female)}. `
                            : ''}
                          {mmrrData.mixedLeaderNote.unrecorded > 0
                            ? `${fmt(mmrrData.mixedLeaderNote.unrecorded)} without gender. `
                            : ''}
                          {mmrrData.mixedLeaderNote.unassigned > 0
                            ? `${fmt(mmrrData.mixedLeaderNote.unassigned)} unit leader(s) are not yet assigned to a section.`
                            : ''}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                {mmrrIssueRecords.length > 0 && (
                  <div className="mmrr-consolidation-list">
                    <div className="mmrr-consolidation-heading">
                      <strong>Registration entries needing consolidation</strong>
                      <span>{mmrrIssueRecords.length} {mmrrIssueRecords.length === 1 ? 'entry' : 'entries'}</span>
                    </div>
                    {mmrrIssueRecords.map(r => (
                      <button
                        type="button"
                        className="mmrr-consolidation-entry"
                        key={r.id}
                        onClick={() => editRecord(r)}
                        title="Open and edit this registration entry"
                      >
                        <span className="mmrr-consolidation-entry-main">
                          <strong>{r.school || 'Unnamed institution'}</strong>
                          <span>{r.division || '—'} · Receipt {r.receipt || '—'}</span>
                        </span>
                        <span className="mmrr-consolidation-issues">
                          {r.issues.join(' · ')}
                        </span>
                        <span className="mmrr-consolidation-action">
                          <Pencil size={13} /> Edit entry
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </Panel>

              <div className="mmrr-sheet">
                <div className="mmrr-header">
                  <div>BOY SCOUTS OF THE PHILIPPINES</div>
                  <div>MONTHLY MEMBERSHIP REGISTRATION REPORT (MMRR)</div>
                </div>

                <div className="mmrr-top-boxes">
                  <table className="mmrr-perf-table">
                    <thead>
                      <tr>
                        <th colSpan={3} className="mmrr-gray-cell">PERFORMANCE MEASURE</th>
                      </tr>
                      <tr>
                        <th />
                        <th>Scout Potential</th>
                        <th>Membership Goal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="mmrr-label-cell">Target CY {mmrrYear}</td>
                        <td>
                          <input
                            type="text"
                            className="mmrr-cell-input"
                            aria-label="Target CY Scout Potential"
                            value={perf.targetPotential ?? ''}
                            onChange={e => updateMmrrPerf('targetPotential', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="mmrr-cell-input"
                            aria-label="Target CY Membership Goal"
                            value={perf.targetGoal ?? ''}
                            onChange={e => updateMmrrPerf('targetGoal', e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="mmrr-label-cell">Actual CY {mmrrYear}</td>
                        <td>
                          <input
                            type="text"
                            className="mmrr-cell-input"
                            aria-label="Actual CY Scout Potential"
                            value={perf.actualPotential ?? ''}
                            onChange={e => updateMmrrPerf('actualPotential', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="mmrr-cell-input"
                            aria-label="Actual CY Membership Goal"
                            value={perf.actualGoal ?? ''}
                            onChange={e => updateMmrrPerf('actualGoal', e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="mmrr-label-cell">% Against Target</td>
                        <td>
                          <input
                            type="text"
                            className="mmrr-cell-input"
                            aria-label="Percent Against Target Scout Potential"
                            value={calcPct(perf.actualPotential, perf.targetPotential, perf.pctPotential)}
                            onChange={e => updateMmrrPerf('pctPotential', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="mmrr-cell-input"
                            aria-label="Percent Against Target Membership Goal"
                            value={calcPct(perf.actualGoal, perf.targetGoal, perf.pctGoal)}
                            onChange={e => updateMmrrPerf('pctGoal', e.target.value)}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="mmrr-meta-table">
                    <tbody>
                      <tr>
                        <th className="mmrr-gray-cell">Council:</th>
                        <td>AGUSAN</td>
                      </tr>
                      <tr>
                        <th className="mmrr-gray-cell">Region:</th>
                        <td>NEMR</td>
                      </tr>
                      <tr>
                        <th className="mmrr-gray-cell">Month of:</th>
                        <td>{mmrrMonthLabel}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mmrr-table-wrap">
                  <table className="mmrr-main-table">
                    <thead>
                      <tr>
                        <th className="mmrr-col-part">PARTICULARS</th>
                        <th className="mmrr-col-fee">FEES</th>
                        <th className="mmrr-col-num">MALE</th>
                        <th className="mmrr-col-num">FEMALE</th>
                        <th className="mmrr-col-num">TOTAL</th>
                        <th className="mmrr-col-total-fee">TOTAL FEES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mmrrData.sections.map(sec => (
                        <React.Fragment key={sec.id}>
                          <tr className="mmrr-section-row">
                            <td colSpan={6}>{sec.title}</td>
                          </tr>
                          {sec.rows.map(row => (
                            <tr key={row.key}>
                              <td className="mmrr-part-cell">{row.label}</td>
                              <td className="mmrr-fee-cell">{fmtDec(row.fee)}</td>
                              <td className={`mmrr-num-cell ${row.needsSplit ? 'needs-input' : ''}`}>
                                <input
                                  type="number"
                                  min="0"
                                  className="mmrr-cell-input"
                                  aria-label={`${row.label} Male`}
                                  value={row.displayMale}
                                  placeholder={row.needsSplit ? '?' : '0'}
                                  onChange={e => updateMmrrRowCell(row.key, 'male', e.target.value)}
                                />
                              </td>
                              <td className={`mmrr-num-cell ${row.needsSplit ? 'needs-input' : ''}`}>
                                <input
                                  type="number"
                                  min="0"
                                  className="mmrr-cell-input"
                                  aria-label={`${row.label} Female`}
                                  value={row.displayFemale}
                                  placeholder={row.needsSplit ? '?' : '0'}
                                  onChange={e => updateMmrrRowCell(row.key, 'female', e.target.value)}
                                />
                              </td>
                              <td className="mmrr-count-cell">{row.total > 0 ? fmt(row.total) : '-'}</td>
                              <td className="mmrr-val-cell">{row.totalFees > 0 ? fmtDec(row.totalFees) : '-'}</td>
                            </tr>
                          ))}
                          {sec.hasBlankRow && (
                            <tr className="mmrr-blank-row">
                              <td>&nbsp;</td><td /><td /><td /><td /><td />
                            </tr>
                          )}
                          <tr className="mmrr-subtotal-row">
                            <td className="mmrr-subtotal-label">SUB-TOTAL</td>
                            <td />
                            <td className="mmrr-count-cell">{sec.subTotal.male > 0 ? fmt(sec.subTotal.male) : '-'}</td>
                            <td className="mmrr-count-cell">{sec.subTotal.female > 0 ? fmt(sec.subTotal.female) : '-'}</td>
                            <td className="mmrr-count-cell">{sec.subTotal.total > 0 ? fmt(sec.subTotal.total) : '-'}</td>
                            <td className="mmrr-val-cell">{sec.subTotal.totalFees > 0 ? fmtDec(sec.subTotal.totalFees) : '-'}</td>
                          </tr>
                        </React.Fragment>
                      ))}
                      <tr className="mmrr-grand-row">
                        <td className="mmrr-subtotal-label">GRAND TOTAL</td>
                        <td />
                        <td className="mmrr-count-cell">{mmrrData.grandTotal.male > 0 ? fmt(mmrrData.grandTotal.male) : '-'}</td>
                        <td className="mmrr-count-cell">{mmrrData.grandTotal.female > 0 ? fmt(mmrrData.grandTotal.female) : '-'}</td>
                        <td className="mmrr-count-cell">{mmrrData.grandTotal.total > 0 ? fmt(mmrrData.grandTotal.total) : '-'}</td>
                        <td className="mmrr-val-cell">{mmrrData.grandTotal.totalFees > 0 ? fmtDec(mmrrData.grandTotal.totalFees) : '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <table className="mmrr-inst-table">
                  <tbody>
                    <tr>
                      <th>No. of Sponsoring Institutions</th>
                      <td>
                        <input
                          type="number"
                          min="0"
                          className="mmrr-cell-input"
                          aria-label="No. of Sponsoring Institutions"
                          value={mmrrData.displayInstitutions}
                          onChange={e => updateMmrrMetaCount('_institutions', e.target.value)}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table className="mmrr-units-table">
                  <thead>
                    <tr>
                      <th>UNITS</th>
                      <th>ENTRY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mmrrData.units.map(u => (
                      <tr key={u.key}>
                        <td className="mmrr-unit-name">{u.label}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            className="mmrr-cell-input"
                            aria-label={`${u.label} unit entry`}
                            value={u.displayCount}
                            onChange={e => updateMmrrMetaCount(`_unit_${u.key}`, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                    <tr className="mmrr-units-total">
                      <td className="mmrr-unit-name">TOTAL</td>
                      <td className="mmrr-count-cell">{fmt(mmrrData.unitsTotal)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="mmrr-signatures">
                  <div className="mmrr-sig-col">
                    <div className="mmrr-sig-heading">Prepared by:</div>
                    <div className="mmrr-sig-box">
                      {mmrrPreparedSigUrl && (
                        <img src={mmrrPreparedSigUrl} alt="Registration Officer e-signature" className="mmrr-sig-img" />
                      )}
                    </div>
                    <div className="mmrr-sig-line" />
                    {mmrrPreparedName && <div className="mmrr-sig-name">{mmrrPreparedName}</div>}
                    <div className="mmrr-sig-role">Registration Officer</div>
                    <div className="mmrr-sig-date">Date: {mmrrPreparedDate ? formatLongDate(mmrrPreparedDate) : ''}</div>
                  </div>
                  <div className="mmrr-sig-col">
                    <div className="mmrr-sig-heading">Certified Correct:</div>
                    <div className="mmrr-sig-box">
                      {mmrrCertifiedSigUrl && (
                        <img src={mmrrCertifiedSigUrl} alt="Council Scout Executive e-signature" className="mmrr-sig-img" />
                      )}
                    </div>
                    <div className="mmrr-sig-line" />
                    {mmrrCertifiedName && <div className="mmrr-sig-name">{mmrrCertifiedName}</div>}
                    <div className="mmrr-sig-role">Council Scout Executive</div>
                    <div className="mmrr-sig-date">Date: {mmrrCertifiedDate ? formatLongDate(mmrrCertifiedDate) : ''}</div>
                  </div>
                </div>
              </div>
            </>;
          })()}
        </section>}

        {page === 'settings' && <section className="page">
          <div className="page-heading"><div><h1>Divisions & Districts</h1><p>Manage organizational categories used in registration forms.</p></div></div>
          <div className="two-col"><Panel title="Add Division" subtitle="Create an additional division."><button className="btn gold" onClick={addDivision}><PlusCircle size={16}/> Add Division</button></Panel><Panel title="Add District" subtitle="Add a district under a selected division."><button className="btn gold" onClick={addDistrict}><PlusCircle size={16}/> Add District</button></Panel><Panel title="Add School" subtitle="Add a school under a division and district."><button className="btn gold" onClick={addSchool}><PlusCircle size={16}/> Add School</button></Panel></div>
          <Panel title="Current Divisions and Districts">{db.divisions.map(d => <div className="division-row" key={d}><b>{d}</b><span>{(db.districts[d] || []).length ? db.districts[d].join(' · ') : 'No districts added yet'}</span>{db.schools?.[d] && Object.entries(db.schools[d]).length ? <div className="school-list"><small>Schools:</small> {Object.entries(db.schools[d]).map(([district, schools]) => <div key={`${d}-${district}`}><strong>{district}:</strong> {schools.join(' · ')}</div>)}</div> : <div className="school-list"><small>No schools added yet.</small></div>}</div>)}</Panel>
        </section>}
        {chartDetail && <div className="chart-modal-backdrop" onClick={closeChartDetail}><div className="chart-modal" onClick={e => e.stopPropagation()}><div className="chart-modal-header"><h3>{chartDetail.title}</h3><button className="chart-modal-close" onClick={closeChartDetail} aria-label="Close graph details">×</button></div><div className="chart-modal-body"><table><thead><tr><th>Invoice Number</th><th>School</th><th>Division</th><th>District</th><th>Scouts</th><th>Leaders</th><th>Date</th></tr></thead><tbody>{chartDetail.records.map(record => <tr key={record.id || `${record.receipt}-${record.school}-${record.date}`}><td>{record.receipt || '—'}</td><td>{record.school || '—'}</td><td>{record.division || '—'}</td><td>{record.district || '—'}</td><td>{fmt(scoutsOf(record))}</td><td>{fmt(record.leaders || 0)}</td><td>{record.date || '—'}</td></tr>)}</tbody></table></div></div></div>}
        <footer className="footer">BSP Agusan Council · Registration Analytics System <span>Prototype v1.0</span></footer>
      </main>
    </div>
  </div>;
}

function aggregateTrendData(records, field, getKey, formatPeriod) {
  const map = {};
  records.forEach(r => {
    if (!r.date) return;
    const key = getKey(r.date);
    if (!key) return;
    map[key] ||= { total: 0, records: [] };
    map[key].total += field === 'scouts' ? scoutsOf(r) : Number(r[field] || 0);
    map[key].records.push(r);
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, bucket]) => ({
      period: formatPeriod(key),
      records: bucket.records,
      [field === 'scouts' ? 'scouts' : 'collections']: bucket.total
    }));
}
function monthlyData(records, field) {
  return aggregateTrendData(
    records,
    field,
    date => date.slice(0, 7),
    key => new Date(`${key}-02`).toLocaleDateString('en-PH', { month: 'short', year: '2-digit' })
  );
}
function dailyData(records, field) {
  return aggregateTrendData(
    records,
    field,
    date => date.slice(0, 10),
    key => new Date(`${key}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: '2-digit' })
  );
}
function weeklyData(records, field) {
  const map = {};
  records.forEach(r => {
    if (!r.date) return;
    const date = new Date(r.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const key = weekStart.toISOString().slice(0,10);
    map[key] ||= 0;
    map[key] += field === 'scouts' ? scoutsOf(r) : Number(r[field] || 0);
  });
  return Object.entries(map).sort(([a],[b]) => a.localeCompare(b)).map(([key,value]) => ({
    period: new Date(`${key}T00:00:00`).toLocaleDateString('en-PH',{month:'short',day:'numeric'}),
    [field === 'scouts' ? 'scouts' : 'collections']: value
  }));
}
function ChartPie({ data, onSelect }) {
  const visible = data.filter(x => x.value > 0);
  const hasData = visible.length > 0;
  if (!hasData) return <EmptyChart/>;
  return <div className="pie-layout"><div className="pie-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={visible} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88} paddingAngle={2} onClick={item => onSelect?.(item)}>{visible.map((x,i) => <Cell key={x.name} fill={SECTION_COLORS[x.name] || COLORS[i % COLORS.length]}/>)}</Pie><Tooltip formatter={v => fmt(v)}/></PieChart></ResponsiveContainer></div><div className="pie-legend">{visible.map((x,i) => <div key={x.name} onClick={() => onSelect?.(x)} className="pie-legend-item"><i style={{background:SECTION_COLORS[x.name] || COLORS[i % COLORS.length]}}/><span>{x.name}</span><b>{fmt(x.value)}</b></div>)}</div></div>;
}
function FormSection({ title, children }) { return <div className="form-section"><h3>{title}</h3><div className="form-grid">{children}</div></div>; }
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function DivisionSummary({ divisions, records }) {
  return <div className="table-wrap"><table><thead><tr><th>Division</th><th>Entries</th><th>Kid</th><th>Kab</th><th>Boy</th><th>Senior</th><th>Rover</th><th>Total Scouts</th><th>Leaders</th><th>Collections</th></tr></thead><tbody>{divisions.map(d => {
    const rs = records.filter(r => r.division === d), t = totalsOf(rs);
    return <tr key={d}><td>{d}</td><td>{t.entries}</td>{SECTIONS.map(([k]) => <td key={k}>{fmt(t[k])}</td>)}<td><b>{fmt(t.scouts)}</b></td><td>{fmt(t.leaders)}</td><td>{money(t.paid)}</td></tr>;
  })}</tbody></table></div>;
}
