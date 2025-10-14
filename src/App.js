import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { ChevronDown, ChevronUp, Download, Upload, Save } from 'lucide-react';

function App() {
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: "山田太郎",
      color: "#3b82f6",
      memo: "",
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
  const [chartType, setChartType] = useState('radar'); // 'radar' or 'scatter'
  const [idealProfile, setIdealProfile] = useState({
    memo: "",
    dataAnalysis: 4,
    hypothesis: 4,
    questioning: 4,
    businessUnderstanding: 4,
    problemFinding: 4,
    problemSolving: 4,
    financial: 4,
    strategy: 4,
    communication: 4,
    support: 4
  });
  const [lastSaved, setLastSaved] = useState(null);

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

  // 初回読み込み時にlocalStorageからデータを復元
  useEffect(() => {
    const savedData = localStorage.getItem('psEvaluationData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.employees) setEmployees(parsed.employees);
        if (parsed.idealProfile) setIdealProfile(parsed.idealProfile);
        if (parsed.selectedEmployees) setSelectedEmployees(parsed.selectedEmployees);
        if (parsed.showIdeal !== undefined) setShowIdeal(parsed.showIdeal);
        setLastSaved(new Date(parsed.savedAt));
      } catch (error) {
        console.error('データの読み込みに失敗しました', error);
      }
    }
  }, []);

  // データを保存
  const saveData = () => {
    const dataToSave = {
      employees,
      idealProfile,
      selectedEmployees,
      showIdeal,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('psEvaluationData', JSON.stringify(dataToSave));
    setLastSaved(new Date());
    alert('データを保存しました！');
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
        alert('データをインポートしました！');
      } catch (error) {
        alert('ファイルの読み込みに失敗しました');
        console.error(error);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // 同じファイルを再度選択できるようにリセット
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
    const { memo, ...actualScores } = scores;
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

  // 散布図用のデータを計算
  const calculateScatterData = () => {
    const categories = {
      analytical: ['dataAnalysis', 'hypothesis', 'problemFinding'], // 分析系
      knowledge: ['businessUnderstanding', 'financial'], // 知識系
      execution: ['problemSolving', 'strategy', 'support'], // 実行系
      interpersonal: ['questioning', 'communication'] // 対人系
    };

    const calculateCategoryAverage = (scores, categoryKeys) => {
      const values = categoryKeys.map(key => scores[key]);
      return values.reduce((a, b) => a + b, 0) / values.length;
    };

    const data = [];

    // 各メンバーのデータ
    employees.forEach(emp => {
      if (selectedEmployees.includes(emp.id)) {
        const analytical = calculateCategoryAverage(emp.scores, categories.analytical);
        const knowledge = calculateCategoryAverage(emp.scores, categories.knowledge);
        const execution = calculateCategoryAverage(emp.scores, categories.execution);
        const interpersonal = calculateCategoryAverage(emp.scores, categories.interpersonal);
        
        // X軸: テクニカルスキル（分析+知識）
        const technical = (analytical + knowledge) / 2;
        // Y軸: ヒューマンスキル（実行+対人）
        const human = (execution + interpersonal) / 2;
        
        data.push({
          name: emp.name,
          technical: parseFloat(technical.toFixed(2)),
          human: parseFloat(human.toFixed(2)),
          color: emp.color,
          type: 'member'
        });
      }
    });

    // 理想形のデータ
    if (showIdeal) {
      const analytical = calculateCategoryAverage(idealProfile, categories.analytical);
      const knowledge = calculateCategoryAverage(idealProfile, categories.knowledge);
      const execution = calculateCategoryAverage(idealProfile, categories.execution);
      const interpersonal = calculateCategoryAverage(idealProfile, categories.interpersonal);
      
      const technical = (analytical + knowledge) / 2;
      const human = (execution + interpersonal) / 2;
      
      data.push({
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
      <div className="max-w-7xl mx-auto">
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
            
            <div className="flex gap-2">
              <button
                onClick={saveData}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                保存
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
              最終保存: {lastSaved.toLocaleString('ja-JP')}
            </div>
          )}
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
            <p className="text-sm text-slate-700">
              <strong>使い方:</strong> 各メンバーの能力レベル（1-4）を入力すると、レーダーチャートで可視化されます。変更は自動保存されませんので、「保存」ボタンを押してください。
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
          <div className="bg-white rounded-2xl shadow-xl p-8">
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
                    domain={[0, 4]} 
                    tick={{ fill: '#64748b' }}
                    tickCount={5}
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
                <ScatterChart margin={{ top: 20, right: 20, bottom: -20, left: -20 }}>
                  {/* 背景の4象限 */}
                  <defs>
                    <pattern id="strengthBg" patternUnits="userSpaceOnUse" width="100%" height="100%">
                      <rect width="100%" height="100%" fill="#fecaca" opacity="0.3"/>
                    </pattern>
                    <pattern id="weaknessBg" patternUnits="userSpaceOnUse" width="100%" height="100%">
                      <rect width="100%" height="100%" fill="#bfdbfe" opacity="0.3"/>
                    </pattern>
                    <pattern id="opportunityBg" patternUnits="userSpaceOnUse" width="100%" height="100%">
                      <rect width="100%" height="100%" fill="#fed7aa" opacity="0.3"/>
                    </pattern>
                    <pattern id="threatBg" patternUnits="userSpaceOnUse" width="100%" height="100%">
                      <rect width="100%" height="100%" fill="#ddd6fe" opacity="0.3"/>
                    </pattern>
                  </defs>
                  
                  {/* 象限の背景色 */}
                  <rect x="50%" y="0" width="50%" height="50%" fill="#fecaca" opacity="0.2" />
                  <rect x="0" y="0" width="50%" height="50%" fill="#bfdbfe" opacity="0.2" />
                  <rect x="0" y="50%" width="50%" height="50%" fill="#fed7aa" opacity="0.2" />
                  <rect x="50%" y="50%" width="50%" height="50%" fill="#ddd6fe" opacity="0.2" />
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  
                  {/* 中央の十字線を太く */}
                  <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#94a3b8" strokeWidth="2" />
                  
                  <XAxis 
                    type="number" 
                    dataKey="technical" 
                    name="テクニカルスキル"
                    domain={[0, 4]}
                    ticks={[0, 1, 2, 3, 4]}
                    label={{ value: 'テクニカルスキル（分析力+知識） →', position: 'bottom', offset: 0 }}
                    tick={{ fill: '#475569' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="human" 
                    name="ヒューマンスキル"
                    domain={[0, 4]}
                    ticks={[0, 1, 2, 3, 4]}
                    label={{ value: 'ヒューマンスキル（実行力+対人力） ↑', angle: -90, position: 'center', offset: 0 }}
                    tick={{ fill: '#475569' }}
                  />
                  <ZAxis range={[400, 400]} />
                  
                  {/* 象限ラベル - 薄い色で、シンプルに */}
                  <text x="75%" y="25%" textAnchor="middle" fill="#991b1b" fillOpacity="0.2" fontSize="18" fontWeight="500">
                    高テクニカル・高ヒューマン
                  </text>
                  
                  <text x="25%" y="25%" textAnchor="middle" fill="#1e40af" fillOpacity="0.2" fontSize="18" fontWeight="500">
                    低テクニカル・高ヒューマン
                  </text>
                  
                  <text x="25%" y="75%" textAnchor="middle" fill="#c2410c" fillOpacity="0.2" fontSize="18" fontWeight="500">
                    低テクニカル・低ヒューマン
                  </text>
                  
                  <text x="75%" y="75%" textAnchor="middle" fill="#5b21b6" fillOpacity="0.2" fontSize="18" fontWeight="500">
                    高テクニカル・低ヒューマン
                  </text>
                  
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                            <p className="font-bold text-slate-800">{data.name}</p>
                            <p className="text-sm text-slate-600">
                              テクニカル: {data.technical}
                            </p>
                            <p className="text-sm text-slate-600">
                              ヒューマン: {data.human}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter data={calculateScatterData()} shape="circle">
                    {calculateScatterData().map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke={entry.type === 'ideal' ? '#64748b' : entry.color}
                        strokeWidth={entry.type === 'ideal' ? 3 : 2}
                        strokeDasharray={entry.type === 'ideal' ? '5 5' : '0'}
                      />
                    ))}
                  </Scatter>
                  <Legend 
                    content={() => (
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {calculateScatterData().map((entry, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ 
                                backgroundColor: entry.color,
                                border: entry.type === 'ideal' ? '2px dashed #64748b' : 'none'
                              }}
                            />
                            <span className="text-sm text-slate-700">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-4">
            {showIdeal && (
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl shadow-lg p-6 border-2 border-slate-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
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
              </div>
            )}

            {employees.map(emp => (
              <div key={emp.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
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
                      className="text-xl font-bold text-slate-800 bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleEmployee(emp.id)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        selectedEmployees.includes(emp.id)
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {selectedEmployees.includes(emp.id) ? '表示中' : '非表示'}
                    </button>
                    <button
                      onClick={() => removeEmployee(emp.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 transition-colors"
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
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
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