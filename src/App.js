import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts';
import { ChevronDown, ChevronUp, Download, Upload, Save, Wifi, WifiOff } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// ドラッグ可能なメンバーカード
function SortableEmployeeCard({ emp, competencyNames, selectedEmployees, toggleEmployee, removeEmployee, handleScoreChange, handleEmployeeMemoChange, calculateAverage, getStrengthsAndWeaknesses, setEmployees }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: emp.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl shadow-lg pt-4 pb-1 px-6">
      <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3 flex-1">
  <div 
    {...attributes}
    {...listeners}
    className="cursor-move p-2 hover:bg-slate-100 rounded"
    title="ドラッグして並び替え"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  </div>
  <button
    onClick={() => {
      setEmployees(prev => prev.map(employee => 
        employee.id === emp.id ? { ...employee, isExpanded: !employee.isExpanded } : employee
      ));
    }}
    className="p-1 hover:bg-slate-100 rounded transition-colors"
    title={emp.isExpanded ? "折りたたむ" : "展開する"}
  >
    {emp.isExpanded ? (
      <ChevronUp className="w-5 h-5 text-slate-600" />
    ) : (
      <ChevronDown className="w-5 h-5 text-slate-600" />
    )}
  </button>
  <div 
    className="w-4 h-4 rounded-full" 
    style={{ backgroundColor: emp.color }}
  ></div>
  <input
    type="text"
    value={emp.name}
    onChange={(e) => {
      const newName = e.target.value;
      setEmployees(prev => prev.map(employee => 
        employee.id === emp.id ? { ...employee, name: newName } : employee
      ));
    }}
    className="text-xl font-bold text-slate-800 bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-blue-500 outline-none transition-colors flex-1"
  />
</div>

<div className="flex gap-2 flex-shrink-0">
  <button
    onClick={() => toggleEmployee(emp.id)}
    className={`px-3 py-1 rounded text-sm font-medium transition-colors whitespace-nowrap ${
      selectedEmployees.includes(emp.id)
        ? 'bg-blue-500 text-white'
        : 'bg-slate-200 text-slate-600'
    }`}
  >
    {selectedEmployees.includes(emp.id) ? '表示中' : '非表示'}
  </button>
  <button
    onClick={() => removeEmployee(emp.id)}
    className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 transition-colors whitespace-nowrap"
  >
    削除
  </button>
</div>
</div>

      <div className="mb-4 flex items-center gap-4">
        <div className="bg-slate-100 rounded-lg px-4 py-2">
          <div className="text-xs text-slate-600">平均スコア</div>
          <div className="text-2xl font-bold text-slate-800">
            {calculateAverage(emp.scores)}
          </div>
        </div>
        
        <div className="flex-1">
          {(() => {
            const { strengths, weaknesses } = getStrengthsAndWeaknesses(emp.scores);
            return (
              <div className="text-xs">
                <div className="mb-1">
                  <span className="text-green-600 font-semibold">強み: </span>
                  <span className="text-slate-600">
                    {strengths.map(s => s.name).join(', ')}
                  </span>
                </div>
                <div>
                  <span className="text-orange-600 font-semibold">課題: </span>
                  <span className="text-slate-600">
                    {weaknesses.map(w => w.name).join(', ')}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {emp.isExpanded && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(competencyNames).map(([key, name]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <label className="text-xs text-slate-600 flex-1">
                  {name}
                </label>
                <select
                  value={emp.scores[key]}
                  onChange={(e) => handleScoreChange(emp.id, key, e.target.value)}
                  className="w-16 px-2 py-1 border border-slate-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="1">Lv.1</option>
                  <option value="2">Lv.2</option>
                  <option value="3">Lv.3</option>
                  <option value="4">Lv.4</option>
                  <option value="5">Lv.5</option>
                </select>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <label className="text-xs text-slate-600 font-semibold mb-2 block">
              📝 メモ
            </label>
            <textarea
              value={emp.memo || ""}
              onChange={(e) => handleEmployeeMemoChange(emp.id, e.target.value)}
              placeholder="育成課題、目標、特記事項などを記入..."
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              rows="3"
            />
          </div>
        </>
      )}
    </div>
  );
}

function App() {
  // ドラッグ&ドロップのセンサー設定
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  })
);

// ドラッグ終了時の処理
const handleDragEnd = (event) => {
  const { active, over } = event;

  if (over && active.id !== over.id) {
    setEmployees((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }
};

  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: "山田太郎",
      color: "#3b82f6",
      memo: "",
      isExpanded: true,
      scores: {
        dataAnalysis: 3,
        hypothesis: 3,
        questioning: 2,
        businessUnderstanding: 3,
        problemFinding: 2,
        problemSolving: 3,
        financial: 2,
        strategy: 3,
        communication: 4,
        support: 3
      }
    },
    {
      id: 2,
      name: "佐藤花子",
      color: "#ec4899",
      memo: "",
      isExpanded: true,
      scores: {
        dataAnalysis: 2,
        hypothesis: 2,
        questioning: 3,
        businessUnderstanding: 2,
        problemFinding: 3,
        problemSolving: 2,
        financial: 2,
        strategy: 2,
        communication: 4,
        support: 4
      }
    }
  ]);

  const [selectedEmployees, setSelectedEmployees] = useState([1, 2]);
  const [showIdeal, setShowIdeal] = useState(true);
  const [chartType, setChartType] = useState('radar');
  const [idealProfile, setIdealProfile] = useState({
    memo: "",
    isExpanded: true,
    dataAnalysis: 5,
    hypothesis: 5,
    questioning: 5,
    businessUnderstanding: 5,
    problemFinding: 5,
    problemSolving: 5,
    financial: 5,
    strategy: 5,
    communication: 5,
    support: 5
  });
  const [lastSaved, setLastSaved] = useState(null);
  const [teamMemo, setTeamMemo] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const competencyNames = {
    dataAnalysis: "データ分析力",
    hypothesis: "仮説思考力",
    questioning: "質問力・ヒアリング力",
    businessUnderstanding: "事業理解力",
    problemFinding: "課題発見力",
    problemSolving: "問題解決力",
    financial: "財務理解力",
    strategy: "戦略立案力",
    communication: "コミュニケーション力",
    support: "伴走支援力"
  };

  // 初回読み込み時にSupabaseからデータを取得
  useEffect(() => {
    loadFromSupabase();
    
    // リアルタイム同期を設定
    const subscription = supabase
      .channel('evaluation_data_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'evaluation_data' },
        (payload) => {
          console.log('データが更新されました:', payload);
          loadFromSupabase();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Supabaseからデータを読み込む
  const loadFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_data')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data && data.data) {
        const parsed = data.data;
        if (parsed.employees) setEmployees(parsed.employees);
        if (parsed.idealProfile) setIdealProfile(parsed.idealProfile);
        if (parsed.selectedEmployees) setSelectedEmployees(parsed.selectedEmployees);
        if (parsed.showIdeal !== undefined) setShowIdeal(parsed.showIdeal);
        if (parsed.teamMemo) setTeamMemo(parsed.teamMemo); 
        setLastSaved(new Date(data.updated_at));
      }
      setIsOnline(true);
    } catch (error) {
      console.error('データの読み込みに失敗:', error);
      setIsOnline(false);
    }
  };

  // Supabaseにデータを保存
  const saveToSupabase = async () => {
    setIsSaving(true);
    try {
      const dataToSave = {
        employees,
        idealProfile,
        selectedEmployees,
        showIdeal,
        teamMemo
      };

      // 既存のデータを更新（最初のレコードを更新）
      const { data: existingData } = await supabase
        .from('evaluation_data')
        .select('id')
        .limit(1)
        .single();

      if (existingData) {
        const { error } = await supabase
          .from('evaluation_data')
          .update({ data: dataToSave })
          .eq('id', existingData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('evaluation_data')
          .insert([{ data: dataToSave }]);

        if (error) throw error;
      }

      setLastSaved(new Date());
      setIsOnline(true);
      alert('データを保存しました！他のユーザーにも同期されます。');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました: ' + error.message);
      setIsOnline(false);
    } finally {
      setIsSaving(false);
    }
  };

  // JSONファイルとしてエクスポート
  const exportData = () => {
    const dataToExport = {
      employees,
      idealProfile,
      selectedEmployees,
      showIdeal,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ps-evaluation-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSONファイルからインポート
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.employees) setEmployees(imported.employees);
        if (imported.idealProfile) setIdealProfile(imported.idealProfile);
        if (imported.selectedEmployees) setSelectedEmployees(imported.selectedEmployees);
        if (imported.showIdeal !== undefined) setShowIdeal(imported.showIdeal);
        alert('データをインポートしました！保存ボタンを押してSupabaseに反映してください。');
      } catch (error) {
        alert('ファイルの読み込みに失敗しました');
        console.error(error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleScoreChange = (employeeId, competency, value) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId 
        ? { ...emp, scores: { ...emp.scores, [competency]: parseInt(value) } }
        : emp
    ));
  };

  const handleIdealChange = (competency, value) => {
    setIdealProfile(prev => ({ ...prev, [competency]: parseInt(value) }));
  };

  const handleIdealMemoChange = (value) => {
    setIdealProfile(prev => ({ ...prev, memo: value }));
  };

  const handleEmployeeMemoChange = (employeeId, value) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId 
        ? { ...emp, memo: value }
        : emp
    ));
  };

  const addEmployee = () => {
    const newId = Math.max(...employees.map(e => e.id), 0) + 1;
    const colors = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#f97316", "#14b8a6"];
    const usedColors = employees.map(e => e.color);
    const availableColor = colors.find(c => !usedColors.includes(c)) || colors[0];
    
    setEmployees(prev => [...prev, {
      id: newId,
      name: `メンバー${newId}`,
      color: availableColor,
      memo: "",
      isExpanded: true,
      scores: {
        dataAnalysis: 1,
        hypothesis: 1,
        questioning: 1,
        businessUnderstanding: 1,
        problemFinding: 1,
        problemSolving: 1,
        financial: 1,
        strategy: 1,
        communication: 1,
        support: 1
      }
    }]);
    setSelectedEmployees(prev => [...prev, newId]);
  };

  const removeEmployee = (id) => {
    if (employees.length <= 1) {
      alert('最低1人のメンバーが必要です');
      return;
    }
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    setSelectedEmployees(prev => prev.filter(empId => empId !== id));
  };

  const toggleEmployee = (id) => {
    setSelectedEmployees(prev => 
      prev.includes(id) 
        ? prev.filter(empId => empId !== id)
        : [...prev, id]
    );
  };

  const prepareChartData = () => {
    const data = Object.keys(competencyNames).map(key => {
      const item = { competency: competencyNames[key] };
      
      if (showIdeal) {
        item['理想'] = idealProfile[key];
      }
      
      employees.forEach(emp => {
        if (selectedEmployees.includes(emp.id)) {
          item[emp.name] = emp.scores[key];
        }
      });
      
      return item;
    });
    
    return data;
  };

  const calculateAverage = (scores) => {
    const { memo, isExpanded,...actualScores } = scores;
    const values = Object.values(actualScores);
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  const getStrengthsAndWeaknesses = (scores) => {
    const entries = Object.entries(scores).map(([key, value]) => ({
      name: competencyNames[key],
      score: value
    }));
    
    const sorted = [...entries].sort((a, b) => b.score - a.score);
    const strengths = sorted.slice(0, 3);
    const weaknesses = sorted.slice(-3).reverse();
    
    return { strengths, weaknesses };
  };

  const calculateScatterData = () => {
    const categories = {
      analytical: ['dataAnalysis', 'hypothesis', 'problemFinding'],
      knowledge: ['businessUnderstanding', 'financial'],
      execution: ['problemSolving', 'strategy', 'support'],
      interpersonal: ['questioning', 'communication']
    };

    const calculateCategoryAverage = (scores, categoryKeys) => {
      const values = categoryKeys.map(key => scores[key]);
      return values.reduce((a, b) => a + b, 0) / values.length;
    };

    const data = [];

    employees.forEach(emp => {
      if (selectedEmployees.includes(emp.id)) {
        const analytical = calculateCategoryAverage(emp.scores, categories.analytical);
        const knowledge = calculateCategoryAverage(emp.scores, categories.knowledge);
        const execution = calculateCategoryAverage(emp.scores, categories.execution);
        const interpersonal = calculateCategoryAverage(emp.scores, categories.interpersonal);
        
        const technical = (analytical + knowledge) / 2;
        const human = (execution + interpersonal) / 2;
        
        data.push({
          id: emp.id,
          name: emp.name,
          technical: parseFloat(technical.toFixed(2)),
          human: parseFloat(human.toFixed(2)),
          color: emp.color,
          type: 'member'
        });
      }
    });

    if (showIdeal) {
      const analytical = calculateCategoryAverage(idealProfile, categories.analytical);
      const knowledge = calculateCategoryAverage(idealProfile, categories.knowledge);
      const execution = calculateCategoryAverage(idealProfile, categories.execution);
      const interpersonal = calculateCategoryAverage(idealProfile, categories.interpersonal);
      
      const technical = (analytical + knowledge) / 2;
      const human = (execution + interpersonal) / 2;
      
      data.push({
        id: 'ideal',
        name: '理想',
        technical: parseFloat(technical.toFixed(2)),
        human: parseFloat(human.toFixed(2)),
        color: '#94a3b8',
        type: 'ideal'
      });
    }

    return data;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-[80%] mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-3">
                PS能力評価チャート
              </h1>
              <p className="text-slate-600 mb-6">
                10の能力を4段階で評価し、視覚的に強み・弱みを把握する
              </p>
            </div>
            
            <div className="flex gap-2 items-center">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-xs font-medium">{isOnline ? 'オンライン' : 'オフライン'}</span>
              </div>
              <button
                onClick={saveToSupabase}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                エクスポート
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium cursor-pointer">
                <Upload className="w-4 h-4" />
                インポート
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {lastSaved && (
            <div className="text-xs text-slate-500 mb-4">
              最終更新: {lastSaved.toLocaleString('ja-JP')}
            </div>
          )}
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
            <p className="text-sm text-slate-700">
              <strong>共有機能有効:</strong> 変更を保存すると、他のユーザーにもリアルタイムで同期されます。
            </p>
          </div>

          <div className="flex gap-3 items-center mb-6">
            <button
              onClick={addEmployee}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              + メンバー追加
            </button>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showIdeal}
                onChange={(e) => setShowIdeal(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-slate-700">理想形を表示</span>
            </label>

            <div className="ml-auto flex gap-2 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setChartType('radar')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  chartType === 'radar'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                レーダーチャート
              </button>
              <button
                onClick={() => setChartType('scatter')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  chartType === 'scatter'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                マトリクス表
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 pb-24">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {chartType === 'radar' ? '能力レーダーチャート' : '能力マトリクス表'}
            </h2>
            {chartType === 'scatter' && (
              <p className="text-sm text-slate-600 mb-4">
                横軸: テクニカルスキル（分析+知識） / 縦軸: ヒューマンスキル（実行+対人）
              </p>
            )}
            
            {chartType === 'radar' ? (
              <ResponsiveContainer width="100%" height={500}>
                <RadarChart data={prepareChartData()}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis 
                    dataKey="competency" 
                    tick={{ fill: '#475569', fontSize: 11 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 5]} 
                    tick={{ fill: '#64748b' }}
                    tickCount={6}
                  />
                  
                  {showIdeal && (
                    <Radar
                      name="理想"
                      dataKey="理想"
                      stroke="#94a3b8"
                      fill="#94a3b8"
                      fillOpacity={0.1}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  )}
                  
                  {employees.filter(emp => selectedEmployees.includes(emp.id)).map(emp => (
                    <Radar
                      key={emp.id}
                      name={emp.name}
                      dataKey={emp.name}
                      stroke={emp.color}
                      fill={emp.color}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  ))}
                  
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={500}>
                <ScatterChart margin={{ top: 10, right: 55, bottom: -90, left: -55 }}>
                  <rect x="50%" y="0" width="50%" height="50%" fill="#fecaca" opacity="0.12" />
                  <rect x="0" y="0" width="50%" height="50%" fill="#bfdbfe" opacity="0.12" />
                  <rect x="0" y="50%" width="50%" height="50%" fill="#fed7aa" opacity="0.12" />
                  <rect x="50%" y="50%" width="50%" height="50%" fill="#ddd6fe" opacity="0.12" />
                  
                  <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#94a3b8" strokeWidth="2" />
                  
                  <XAxis 
                    type="number" 
                    dataKey="technical" 
                    name="テクニカルスキル"
                    domain={[0, 5]}
                    label={{ value: 'テクニカルスキル（分析力+知識） →', position: 'bottom', offset: 90, style: { fontSize: 14, fill: '#475569' } }}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="human" 
                    name="ヒューマンスキル"
                    domain={[0, 5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                    label={{ value: 'ヒューマンスキル（実行力+対人力） ↑', angle: -90, position: 'left', offset: 60, style: { fontSize: 14, fill: '#475569' } }}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ZAxis range={[2500, 2500]} />
                  
                  <text x="75%" y="27%" textAnchor="middle" fill="#991b1b" fillOpacity="0.2" fontSize="16" fontWeight="600">
                    高テクニカル・高ヒューマン
                  </text>
                  
                  <text x="25%" y="27%" textAnchor="middle" fill="#1e40af" fillOpacity="0.2" fontSize="16" fontWeight="600">
                    低テクニカル・高ヒューマン
                  </text>
                  
                  <text x="25%" y="77%" textAnchor="middle" fill="#c2410c" fillOpacity="0.2" fontSize="16" fontWeight="600">
                    低テクニカル・低ヒューマン
                  </text>
                  
                  <text x="75%" y="77%" textAnchor="middle" fill="#5b21b6" fillOpacity="0.2" fontSize="16" fontWeight="600">
                    高テクニカル・低ヒューマン
                  </text>
                  
                  <Tooltip 
                    cursor={false}
                    content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-slate-300">
                            <p className="font-bold text-slate-800 text-lg mb-2">{data.name}</p>
                            <div className="space-y-1 text-sm">
                              <p className="text-slate-600">
                                <span className="font-semibold">テクニカル:</span> {data.technical}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-semibold">ヒューマン:</span> {data.human}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                 <Scatter 
  data={calculateScatterData()} 
  shape={(props) => {
    const { cx, cy, fill, stroke, strokeWidth, strokeDasharray } = props;
    const radius = 12; // ← ここでサイズ変更！
    return (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />
    );
  }}
>
{calculateScatterData().map((entry) => (
  <Cell 
    key={`cell-${entry.id}`}
                        fill={entry.type === 'ideal' ? 'transparent' : entry.color}
                        stroke={entry.type === 'ideal' ? entry.color : '#ffffff'}
                        strokeWidth={entry.type === 'ideal' ? 4 : 4}
                        strokeDasharray={entry.type === 'ideal' ? '8 4' : '0'}
                      />
                    ))}
                  </Scatter>
                  <Legend 
  content={() => (
    <div 
      className="flex flex-wrap justify-center gap-1" 
      style={{ 
        position: 'absolute', 
        bottom: '30px',  // 下から20pxの位置
        left: '57%', 
        transform: 'translateX(-50%)',
        width: '100%'
      }}
    >
                        {calculateScatterData().map((entry) => (
  <div key={entry.id} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                            <div 
                              className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm font-medium text-slate-700">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            )}
             <div className="hidden lg:block mt-16 pt-6 border-t border-slate-200 -mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              📝 チーム全体のメモ
              <span className="text-xs font-normal text-slate-500">（評価全体に関する気づきや方針など）</span>
            </h3>
            <textarea
              value={teamMemo}
              onChange={(e) => setTeamMemo(e.target.value)}
              placeholder="例：今期の評価方針、全体的な傾向、次回の見直しポイントなど..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
              rows="30"
            />
          </div>
          </div>

          <div className="space-y-3">
          {showIdeal && (
  <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl shadow-lg pt-3 pb-0 px-6 border-2 border-slate-300">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIdealProfile(prev => ({ ...prev, isExpanded: !prev.isExpanded }))}
          className="p-1 hover:bg-slate-100 rounded transition-colors"
          title={idealProfile.isExpanded ? "折りたたむ" : "展開する"}
        >
          {idealProfile.isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-600" />
          )}
        </button>
        <div className="w-4 h-4 rounded-full bg-slate-400"></div>
        <h3 className="text-xl font-bold text-slate-700">理想形（目標レベル）</h3>
      </div>
    </div>

    <div className="mb-4">
      <div className="bg-white rounded-lg px-4 py-2 inline-block">
        <div className="text-xs text-slate-600">平均スコア</div>
        <div className="text-2xl font-bold text-slate-800">
          {calculateAverage(idealProfile)}
        </div>
      </div>
    </div>

    {idealProfile.isExpanded && (
      <>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(competencyNames).map(([key, name]) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <label className="text-xs text-slate-600 flex-1">
                {name}
              </label>
              <select
                value={idealProfile[key]}
                onChange={(e) => handleIdealChange(key, e.target.value)}
                className="w-16 px-2 py-1 border border-slate-300 rounded text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none bg-white"
              >
                <option value="1">Lv.1</option>
                <option value="2">Lv.2</option>
                <option value="3">Lv.3</option>
                <option value="4">Lv.4</option>
                <option value="5">Lv.5</option>
              </select>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-300">
          <label className="text-xs text-slate-600 font-semibold mb-2 block">
            📝 メモ
          </label>
          <textarea
            value={idealProfile.memo || ""}
            onChange={(e) => handleIdealMemoChange(e.target.value)}
            placeholder="目標設定の理由や達成時期などを記入..."
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none resize-none"
            rows="3"
          />
        </div>
      </>
    )}
  </div>
)}

<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={employees.map(emp => emp.id)}
    strategy={verticalListSortingStrategy}
  >
    {employees.map(emp => (
      <SortableEmployeeCard
        key={emp.id}
        emp={emp}
        competencyNames={competencyNames}
        selectedEmployees={selectedEmployees}
        toggleEmployee={toggleEmployee}
        removeEmployee={removeEmployee}
        handleScoreChange={handleScoreChange}
        handleEmployeeMemoChange={handleEmployeeMemoChange}
        calculateAverage={calculateAverage}
        getStrengthsAndWeaknesses={getStrengthsAndWeaknesses}
        setEmployees={setEmployees}
      />
    ))}
  </SortableContext>
</DndContext>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-bold text-slate-800 mb-2">Lv.1 基礎</h3>
              <p className="text-xs text-slate-600">基本的な理解と実行ができる</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💪</span>
              </div>
              <h3 className="font-bold text-slate-800 mb-2">Lv.2 実践</h3>
              <p className="text-xs text-slate-600">状況に応じて応用できる</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-bold text-slate-800 mb-2">Lv.3 応用</h3>
              <p className="text-xs text-slate-600">深い分析と戦略的思考ができる</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="font-bold text-slate-800 mb-2">Lv.4 エキスパート</h3>
              <p className="text-xs text-slate-600">創造的・予測的に貢献できる</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
  <div className="text-center">
    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
      <span className="text-2xl">🏆</span>
    </div>
    <h3 className="font-bold text-slate-800 mb-2">Lv.5 マスター</h3>
    <p className="text-xs text-slate-600">組織をリードし、他者を育成できる</p>
  </div>
</div>

        <div className="mt-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-4">💡 活用のポイント</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold mb-2 text-lg">1on1での活用</h3>
              <p className="text-sm text-blue-50">チャートを見せながら「今月はこの能力を伸ばそう」と具体的な成長目標を設定</p>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-lg">チーム編成</h3>
              <p className="text-sm text-blue-50">お互いの強み・弱みを補完し合えるペア/チームを組める</p>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-lg">採用基準</h3>
              <p className="text-sm text-blue-50">「最低でもLv.2が5項目以上」など、明確な採用ラインを設定</p>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-lg">育成計画</h3>
              <p className="text-sm text-blue-50">「3ヶ月後にはこの形に」と理想形との差分から逆算して育成</p>
            </div>
          </div>
          
          {chartType === 'scatter' && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <h3 className="font-bold mb-3 text-lg">📊 マトリクスの見方</h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm text-blue-50">
                <div className="bg-white/10 p-3 rounded-lg">
                  <strong className="text-white">右上:</strong> 高テクニカル・高ヒューマン
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <strong className="text-white">左上:</strong> 低テクニカル・高ヒューマン
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <strong className="text-white">左下:</strong> 低テクニカル・低ヒューマン
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <strong className="text-white">右下:</strong> 高テクニカル・低ヒューマン
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;