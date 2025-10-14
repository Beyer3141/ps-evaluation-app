import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { ChevronDown, ChevronUp, Download, Upload, Save } from 'lucide-react';

function App() {
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: "山田太郎",
      color: "#3b82f6",
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
  const [idealProfile, setIdealProfile] = useState({
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

  const addEmployee = () => {
    const newId = Math.max(...employees.map(e => e.id), 0) + 1;
    const colors = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#f97316", "#14b8a6"];
    const usedColors = employees.map(e => e.color);
    const availableColor = colors.find(c => !usedColors.includes(c)) || colors[0];
    
    setEmployees(prev => [...prev, {
      id: newId,
      name: `メンバー${newId}`,
      color: availableColor,
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
    const values = Object.values(scores);
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
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">能力レーダーチャート</h2>
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
        </div>
      </div>
    </div>
  );
}

export default App;