import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, LineChart, Line, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { ChevronDown, ChevronUp, Download, Upload, Save, Wifi, WifiOff, History, Calendar, TrendingUp, Users, Check, X, Clock, Menu, ArrowLeftRight, Image, FileText, Keyboard } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// トースト通知コンポーネント
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }[type] || 'bg-slate-500';

  const icon = {
    success: <Check className="w-5 h-5" />,
    error: <X className="w-5 h-5" />,
    info: <Clock className="w-5 h-5" />
  }[type];

  return (
    <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] animate-slide-in`}>
      {icon}
      <span className="flex-1 font-medium">{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 rounded p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// トースト管理コンポーネント
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// キーボードショートカットヘルプモーダル
function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + S', description: 'データを保存' },
    { key: 'Ctrl + E', description: 'データをエクスポート' },
    { key: '1-4', description: 'タブ切り替え（現在/履歴/比較/分析）' },
    { key: 'Ctrl + M', description: 'メンバー追加' },
    { key: 'Esc', description: 'モーダルを閉じる' },
    { key: '?', description: 'このヘルプを表示' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full mx-4 animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Keyboard className="w-6 h-6" />
            キーボードショートカット
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          {shortcuts.map((shortcut, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
              <span className="text-sm text-slate-600">{shortcut.description}</span>
              <kbd className="px-3 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        <div className="mt-6 text-xs text-slate-500 text-center">
          ヒント: いつでも <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded">?</kbd> キーでこのヘルプを表示できます
        </div>
      </div>
    </div>
  );
}

// モバイルメニュー
function MobileMenu({ viewMode, setViewMode, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute top-0 right-0 w-64 h-full bg-white shadow-xl p-4 animate-slide-in-right">
        <button onClick={onClose} className="absolute top-4 right-4">
          <X className="w-6 h-6" />
        </button>
        <nav className="mt-12 space-y-2">
          {[
            { id: 'current', icon: Calendar, label: '現在の評価' },
            { id: 'history', icon: History, label: '成長履歴' },
            { id: 'compare', icon: ArrowLeftRight, label: '履歴比較' },
            { id: 'comparison', icon: TrendingUp, label: '時系列比較' },
            { id: 'dashboard', icon: Users, label: 'チーム分析' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                setViewMode(item.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                viewMode === item.id
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

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
    <div ref={setNodeRef} style={style} className="bg-white rounded-xl shadow-lg pt-4 pb-1 px-4 md:px-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <div 
            {...attributes}
            {...listeners}
            className="cursor-move p-2 hover:bg-slate-100 rounded flex-shrink-0"
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
            className="p-1 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
          >
            {emp.isExpanded ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
          </button>
          <div className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0" style={{ backgroundColor: emp.color }}></div>
          <input
            type="text"
            value={emp.name}
            onChange={(e) => {
              const newName = e.target.value;
              setEmployees(prev => prev.map(employee => 
                employee.id === emp.id ? { ...employee, name: newName } : employee
              ));
            }}
            className="text-lg md:text-xl font-bold text-slate-800 bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-blue-500 outline-none transition-colors flex-1 min-w-0"
          />
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => toggleEmployee(emp.id)}
            className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
              selectedEmployees.includes(emp.id) ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {selectedEmployees.includes(emp.id) ? '表示中' : '非表示'}
          </button>
          <button
            onClick={() => removeEmployee(emp.id)}
            className="px-2 md:px-3 py-1 bg-red-500 text-white rounded text-xs md:text-sm font-medium hover:bg-red-600 transition-colors whitespace-nowrap"
          >
            削除
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="bg-slate-100 rounded-lg px-3 md:px-4 py-2">
          <div className="text-xs text-slate-600">平均スコア</div>
          <div className="text-xl md:text-2xl font-bold text-slate-800">
            {calculateAverage(emp.scores)}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          {(() => {
            const { strengths, weaknesses } = getStrengthsAndWeaknesses(emp.scores);
            return (
              <div className="text-xs">
                <div className="mb-1 truncate">
                  <span className="text-green-600 font-semibold">強み: </span>
                  <span className="text-slate-600">{strengths.map(s => s.name).join(', ')}</span>
                </div>
                <div className="truncate">
                  <span className="text-orange-600 font-semibold">課題: </span>
                  <span className="text-slate-600">{weaknesses.map(w => w.name).join(', ')}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {emp.isExpanded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(competencyNames).map(([key, name]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <label className="text-xs text-slate-600 flex-1">{name}</label>
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
            <label className="text-xs text-slate-600 font-semibold mb-2 block">📝 メモ</label>
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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

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
      id: 1, name: "山田太郎", color: "#3b82f6", memo: "", isExpanded: true,
      scores: { dataAnalysis: 3, hypothesis: 3, questioning: 2, businessUnderstanding: 3, problemFinding: 2, problemSolving: 3, financial: 2, strategy: 3, communication: 4, support: 3 }
    },
    {
      id: 2, name: "佐藤花子", color: "#ec4899", memo: "", isExpanded: true,
      scores: { dataAnalysis: 2, hypothesis: 2, questioning: 3, businessUnderstanding: 2, problemFinding: 3, problemSolving: 2, financial: 2, strategy: 2, communication: 4, support: 4 }
    }
  ]);

  const [selectedEmployees, setSelectedEmployees] = useState([1, 2]);
  const [showIdeal, setShowIdeal] = useState(true);
  const [chartType, setChartType] = useState('radar');
  const [idealProfile, setIdealProfile] = useState({
    memo: "", isExpanded: true,
    dataAnalysis: 5, hypothesis: 5, questioning: 5, businessUnderstanding: 5,
    problemFinding: 5, problemSolving: 5, financial: 5, strategy: 5, communication: 5, support: 5
  });
  const [lastSaved, setLastSaved] = useState(null);
  const [teamMemo, setTeamMemo] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('current');
  const [evaluationHistory, setEvaluationHistory] = useState([]);
  const [newEvaluationDate, setNewEvaluationDate] = useState('');
  const [newEvaluationMemo, setNewEvaluationMemo] = useState('');
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [compareHistory1, setCompareHistory1] = useState(null);
  const [compareHistory2, setCompareHistory2] = useState(null);
  const chartRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const [expandedCriteria, setExpandedCriteria] = useState({});
  const [showCriteria, setShowCriteria] = useState(false);

  const competencyNames = {
    dataAnalysis: "データ分析力", hypothesis: "仮説思考力", questioning: "質問力・ヒアリング力",
    businessUnderstanding: "事業理解力", problemFinding: "課題発見力", problemSolving: "問題解決力",
    financial: "財務理解力", strategy: "戦略立案力", communication: "コミュニケーション力", support: "伴走支援力"
  };

  const competencyCriteria = {
    dataAnalysis: {
      name: "データ分析力",
      levels: {
        1: "基本的なデータの読み取りができる。表やグラフを理解できる。",
        2: "複数のデータソースを組み合わせて分析できる。基本的な統計手法を使える。",
        3: "複雑なデータから洞察を導き出せる。適切な分析手法を選択できる。",
        4: "高度な分析手法を用いて、ビジネスインパクトを予測できる。",
        5: "新しい分析手法を開発し、組織全体の分析基準を策定できる。"
      }
    },
    hypothesis: {
      name: "仮説思考力",
      levels: {
        1: "稼働の課題に対して正解の有無を問わず仮説を立てることができる。",
        2: "データやヒアリング基づいた仮説を立て、検証方法を考えられる。",
        3: "複数の課題から仮説を立て、優先順位をつけて検証できる。",
        4: "稼働の課題から戦略的な仮説を立てられる。",
        5: "稼働外の事業全体においての仮説を立案できる。"
      }
    },
    questioning: {
      name: "質問力・ヒアリング力",
      levels: {
        1: "基本的な質問ができる。相手の話を聞くことができる。",
        2: "目的に応じた質問ができる。相手の意図を引き出せる。",
        3: "本質的な課題を引き出す質問ができる。深掘りができる。",
        4: "相手が気づいていない課題を顕在化させる質問ができる。",
        5: "組織全体の課題を引き出し、変革を促す質問ができる。"
      }
    },
    businessUnderstanding: {
      name: "事業理解力",
      levels: {
        1: "自社の事業内容を説明できる。",
        2: "事業モデルやビジネスフローを理解している。",
        3: "業界動向や競合を理解し、事業課題を把握できる。",
        4: "事業戦略と各施策の関連を理解し、提案できる。",
        5: "事業拡大のための必要項目を理解し、そのための提案、実行ができる。"
      }
    },
    problemFinding: {
      name: "課題発見力",
      levels: {
        1: "明確な問題を認識できる。",
        2: "データから問題の兆候を発見できる。",
        3: "潜在的な課題を発見し、構造化できる。",
        4: "複雑な課題の本質を見抜き、優先順位をつけられる。",
        5: "組織全体の構造的課題を発見し、変革を主導できる。"
      }
    },
    problemSolving: {
      name: "問題解決力",
      levels: {
        1: "指示された方法で問題を解決できる。",
        2: "自分で解決策を考え、実行できる。",
        3: "複数の解決策を比較検討し、最適な方法を選択できる。",
        4: "自分以外の環境要因などを判断し、改善を実践できる",
        5: "組織横断的な問題を解決し、仕組み化できる。"
      }
    },
    financial: {
      name: "財務理解力",
      levels: {
        1: "基本的な項目を理解している（応募単価、内定単価など）。",
        2: "広告予算、架電件数から売上を概算し、利益率を考えられる",
        3: "チーム全体の収益を把握し、そのために必要な行動が取れる",
        4: "事業の拡大に必要な予算等を把握し、そのための新規採用等の必要性を説明できる",
        5: "新規事業に関して、余白等を理解し、進行することができる"
      }
    },
    strategy: {
      name: "戦略立案力",
      levels: {
        1: "稼働の改善のための方法を理解している。",
        2: "部分的な施策を立案できる。",
        3: "中長期的な視点で施策を立案できる。",
        4: "事業全体を見据えた戦略を立案できる。",
        5: "組織全体の方向性を示す戦略を策定できる。"
      }
    },
    communication: {
      name: "コミュニケーション力",
      levels: {
        1: "報連相ができる。基本的な情報共有ができる。",
        2: "相手に合わせた説明ができる。円滑に意思疎通できる。",
        3: "複雑な内容を分かりやすく伝えられる。合意形成ができる。",
        4: "ステークホルダーを巻き込み、プロジェクトを推進できる。",
        5: "組織全体のコミュニケーションを活性化させられる。"
      }
    },
    support: {
      name: "伴走支援力",
      levels: {
        1: "指示されたサポートができる。",
        2: "相手の状況に応じた支援ができる。",
        3: "自律的な成長を促す支援ができる。",
        4: "組織全体の成長を見据えた育成ができる。",
        5: "育成の仕組みを作り、組織能力を向上させられる。"
      }
    }
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S: 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToSupabase(false);
      }
      // Ctrl+E: エクスポート
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportData();
      }
      // Ctrl+M: メンバー追加
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        addEmployee();
      }
      // 1-5: タブ切り替え
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '1') setViewMode('current');
        if (e.key === '2') setViewMode('history');
        if (e.key === '3') setViewMode('compare');
        if (e.key === '4') setViewMode('comparison');
        if (e.key === '5') setViewMode('dashboard');
      }
      // ?: ヘルプ表示
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowKeyboardHelp(true);
      }
      // Esc: モーダルを閉じる
      if (e.key === 'Escape') {
        setShowKeyboardHelp(false);
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    loadFromSupabase();
    loadHistoryFromSupabase();
    
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

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (lastSaved === null) return;
    setHasUnsavedChanges(true);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveToSupabase(true);
    }, 3000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [employees, idealProfile, selectedEmployees, showIdeal, teamMemo]);

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

  const loadHistoryFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_history')
        .select('*')
        .order('evaluation_date', { ascending: true });

      if (error) throw error;
      if (data) {
        setEvaluationHistory(data.map(item => ({
          id: item.id,
          date: item.evaluation_date,
          memo: item.memo || '',
          data: item.data
        })));
      }
    } catch (error) {
      console.error('履歴の読み込みに失敗:', error);
    }
  };

  const saveToSupabase = async (isAutoSave = false) => {
    setIsSaving(true);
    try {
      const dataToSave = {
        employees, idealProfile, selectedEmployees, showIdeal, teamMemo
      };

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
      setHasUnsavedChanges(false);
      setIsOnline(true);
      addToast(isAutoSave ? '自動保存しました' : 'データを保存しました！', 'success');
    } catch (error) {
      console.error('保存エラー:', error);
      addToast('保存に失敗しました: ' + error.message, 'error');
      setIsOnline(false);
    } finally {
      setIsSaving(false);
    }
  };

  const saveAsHistory = async () => {
    if (!newEvaluationDate) {
      addToast('評価日を入力してください', 'error');
      return;
    }

    try {
      const dataToSave = {
        employees: employees.map(emp => ({
          id: emp.id, name: emp.name, color: emp.color, scores: emp.scores
        }))
      };

      const { error } = await supabase
        .from('evaluation_history')
        .insert([{
          evaluation_date: newEvaluationDate,
          memo: newEvaluationMemo,
          data: dataToSave
        }]);

      if (error) throw error;

      await loadHistoryFromSupabase();
      setNewEvaluationDate('');
      setNewEvaluationMemo('');
      addToast('評価を履歴として保存しました！', 'success');
    } catch (error) {
      console.error('保存エラー:', error);
      addToast('保存に失敗しました: ' + error.message, 'error');
    }
  };

  const exportData = () => {
    const dataToExport = {
      employees, idealProfile, selectedEmployees, showIdeal,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ps-evaluation-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('データをエクスポートしました', 'success');
  };

  const exportChartAsSVG = () => {
    if (!chartRef.current) {
      addToast('チャートが見つかりません', 'error');
      return;
    }

    try {
      const svgElement = chartRef.current.querySelector('svg');
      if (!svgElement) {
        addToast('SVGが見つかりません', 'error');
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chart-${new Date().toISOString().split('T')[0]}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('チャートをSVGで保存しました', 'success');
    } catch (error) {
      addToast('SVG保存に失敗しました', 'error');
      console.error(error);
    }
  };

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
        addToast('データをインポートしました！', 'success');
      } catch (error) {
        addToast('ファイルの読み込みに失敗しました', 'error');
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
      emp.id === employeeId ? { ...emp, memo: value } : emp
    ));
  };

  const addEmployee = () => {
    const newId = Math.max(...employees.map(e => e.id), 0) + 1;
    const colors = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#f97316", "#14b8a6"];
    const availableColor = colors.find(c => !employees.map(e => e.color).includes(c)) || colors[0];
    
    setEmployees(prev => [...prev, {
      id: newId, name: `メンバー${newId}`, color: availableColor, memo: "", isExpanded: true,
      scores: { dataAnalysis: 1, hypothesis: 1, questioning: 1, businessUnderstanding: 1, problemFinding: 1, problemSolving: 1, financial: 1, strategy: 1, communication: 1, support: 1 }
    }]);
    setSelectedEmployees(prev => [...prev, newId]);
    addToast('メンバーを追加しました', 'success');
  };

  const removeEmployee = (id) => {
    if (employees.length <= 1) {
      addToast('最低1人のメンバーが必要です', 'error');
      return;
    }
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    setSelectedEmployees(prev => prev.filter(empId => empId !== id));
    addToast('メンバーを削除しました', 'success');
  };

  const toggleEmployee = (id) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]
    );
  };

  const prepareChartData = () => {
    const data = Object.keys(competencyNames).map(key => {
      const item = { competency: competencyNames[key] };
      if (showIdeal) item['理想'] = idealProfile[key];
      employees.forEach(emp => {
        if (selectedEmployees.includes(emp.id)) item[emp.name] = emp.scores[key];
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
      name: competencyNames[key], score: value
    }));
    const sorted = [...entries].sort((a, b) => b.score - a.score);
    return { strengths: sorted.slice(0, 3), weaknesses: sorted.slice(-3).reverse() };
  };

  const prepareTimelineData = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return [];

    const timeline = evaluationHistory.map(history => {
      const empData = history.data.employees.find(e => e.id === employeeId);
      if (!empData) return null;
      return { date: history.date, average: calculateAverage(empData.scores), ...empData.scores };
    }).filter(Boolean);

    timeline.push({ date: '現在', average: calculateAverage(employee.scores), ...employee.scores });
    return timeline;
  };

  const calculateTeamStats = () => {
    const stats = {};
    Object.keys(competencyNames).forEach(comp => {
      const scores = employees.map(emp => emp.scores[comp]);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      stats[comp] = {
        name: competencyNames[comp],
        average: avg.toFixed(1),
        max: Math.max(...scores),
        min: Math.min(...scores),
        range: Math.max(...scores) - Math.min(...scores)
      };
    });
    return stats;
  };

  const teamStats = calculateTeamStats();
  const sortedByStrength = Object.entries(teamStats).sort((a, b) => parseFloat(b[1].average) - parseFloat(a[1].average));
  const topStrengths = sortedByStrength.slice(0, 3);
  const bottomWeaknesses = sortedByStrength.slice(-3).reverse();

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
          id: emp.id, name: emp.name,
          technical: parseFloat(technical.toFixed(2)),
          human: parseFloat(human.toFixed(2)),
          color: emp.color, type: 'member'
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
        id: 'ideal', name: '理想',
        technical: parseFloat(technical.toFixed(2)),
        human: parseFloat(human.toFixed(2)),
        color: '#94a3b8', type: 'ideal'
      });
    }

    return data;
  };

  // 履歴比較用のデータ準備
  const prepareCompareData = () => {
    if (!compareHistory1 || !compareHistory2) return null;

    const history1 = evaluationHistory.find(h => h.id === compareHistory1);
    const history2 = evaluationHistory.find(h => h.id === compareHistory2);

    if (!history1 || !history2) return null;

    return { history1, history2 };
  };

  const calculateDifference = (scores1, scores2, key) => {
    return scores2[key] - scores1[key];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 pb-20 md:pb-8">
      <style>{`
        @keyframes slide-in {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
      `}</style>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <KeyboardShortcutsModal isOpen={showKeyboardHelp} onClose={() => setShowKeyboardHelp(false)} />
      <MobileMenu viewMode={viewMode} setViewMode={setViewMode} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="max-w-full md:max-w-[90%] lg:max-w-[80%] mx-auto px-2 md:px-0">
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 mb-4 md:mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-4xl font-bold text-slate-800 mb-2 md:mb-3">
                PS能力評価チャート
              </h1>
              <p className="text-sm md:text-base text-slate-600">
                10の能力を5段階で評価し、視覚的に強み・弱みを把握する
              </p>
            </div>
            
            <div className="hidden md:flex gap-2 items-center flex-shrink-0">
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="p-2 hover:bg-slate-100 rounded-lg"
                title="キーボードショートカット (?)">
                <Keyboard className="w-5 h-5 text-slate-600" />
              </button>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-xs font-medium">{hasUnsavedChanges ? '未保存' : 'オンライン'}</span>
              </div>
              <button
                onClick={() => saveToSupabase(false)}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                title="保存 (Ctrl+S)"
              >
                <Save className="w-4 h-4" />
                {isSaving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={exportChartAsSVG}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                title="チャートをSVGで保存"
              >
                <Image className="w-4 h-4" />
                SVG
              </button>
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                title="エクスポート (Ctrl+E)"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium cursor-pointer">
                <Upload className="w-4 h-4" />
                インポート
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
            </div>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg flex-shrink-0"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {lastSaved && (
            <div className="text-xs text-slate-500 mb-4">
              最終保存: {lastSaved.toLocaleString('ja-JP')}
              {hasUnsavedChanges && <span className="ml-2 text-orange-600">● 未保存の変更あり</span>}
            </div>
          )}
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 md:p-4 rounded mb-4 md:mb-6">
            <p className="text-xs md:text-sm text-slate-700">
              <strong>💡 ヒント:</strong> <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs">?</kbd> キーでショートカット一覧を表示
            </p>
          </div>

          {/* 能力評価基準（折りたたみ可能） */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg mb-6 overflow-hidden">
            {/* ヘッダー部分（クリックで全体を折りたたみ） */}
            <button
              onClick={() => setShowCriteria(!showCriteria)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-100 transition-colors"
            >
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                📋 能力評価基準
                <span className="text-xs font-normal text-slate-500">（クリックで展開/折りたたみ）</span>
              </h3>
              <ChevronDown 
                className={`w-5 h-5 text-slate-600 transition-transform ${
                  showCriteria ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {/* 展開時のみ表示 */}
            {showCriteria && (
              <div className="p-4 border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(competencyCriteria).map(([key, competency]) => (
                    <div key={key} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <button
                        onClick={() => setExpandedCriteria(prev => ({
                          ...prev,
                          [key]: !prev[key]
                        }))}
                        className="w-full p-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                      >
                        <span className="font-semibold text-slate-800 text-sm">
                          {competency.name}
                        </span>
                        <ChevronDown 
                          className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${
                            expandedCriteria[key] ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      
                      {expandedCriteria[key] && (
                        <div className="px-3 pb-3 border-t border-slate-200 bg-slate-50">
                          <div className="space-y-2 mt-2">
                            {Object.entries(competency.levels).map(([level, description]) => (
                              <div key={level} className="flex gap-2">
                                <span className="font-bold text-blue-600 text-xs flex-shrink-0">
                                  Lv.{level}
                                </span>
                                <span className="text-xs text-slate-700">
                                  {description}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="hidden md:flex gap-2 bg-slate-100 p-1 rounded-lg mb-6">
            {[
              { id: 'current', icon: Calendar, label: '現在の評価', key: '1' },
              { id: 'history', icon: History, label: '成長履歴', key: '2' },
              { id: 'compare', icon: ArrowLeftRight, label: '履歴比較', key: '3' },
              { id: 'comparison', icon: TrendingUp, label: '時系列比較', key: '4' },
              { id: 'dashboard', icon: Users, label: 'チーム分析', key: '5' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setViewMode(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === item.id ? 'bg-white text-blue-600 shadow' : 'text-slate-600'
                }`}
                title={`${item.label} (${item.key})`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="md:hidden flex justify-center gap-2 mb-4">
            {['current', 'history', 'compare', 'comparison', 'dashboard'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`w-2 h-2 rounded-full transition-all ${
                  viewMode === mode ? 'bg-blue-600 w-8' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-center mb-6">
            <button
              onClick={addEmployee}
              className="px-3 md:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
              title="メンバー追加 (Ctrl+M)"
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
                className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  chartType === 'radar' ? 'bg-white text-blue-600 shadow' : 'text-slate-600'
                }`}
              >
                レーダー
              </button>
              <button
                onClick={() => setChartType('scatter')}
                className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  chartType === 'scatter' ? 'bg-white text-blue-600 shadow' : 'text-slate-600'
                }`}
              >
                マトリクス
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'current' && (
          <div className="grid lg:grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 pb-8 md:pb-24" ref={chartRef}>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 md:p-4 rounded mb-4 md:mb-6">
                <p className="text-xs md:text-sm text-slate-700 font-semibold mb-2">
                  💾 評価を履歴として保存
                </p>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-slate-600 block mb-1">評価日</label>
                    <input
                      type="date"
                      value={newEvaluationDate}
                      onChange={(e) => setNewEvaluationDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-600 block mb-1">メモ（任意）</label>
                    <input
                      type="text"
                      value={newEvaluationMemo}
                      onChange={(e) => setNewEvaluationMemo(e.target.value)}
                      placeholder="例: Q1評価"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <button
                    onClick={saveAsHistory}
                    className="sm:self-end px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium text-sm whitespace-nowrap"
                  >
                    履歴に保存
                  </button>
                </div>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
                {chartType === 'radar' ? '能力レーダーチャート' : '能力マトリクス表'}
              </h2>
              {chartType === 'scatter' && (
                <p className="text-xs md:text-sm text-slate-600 mb-4">
                  横軸: テクニカルスキル / 縦軸: ヒューマンスキル
                </p>
              )}
              
              {chartType === 'radar' ? (
                <ResponsiveContainer width="100%" height={400} className="md:h-[500px]">
                  <RadarChart data={prepareChartData()}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="competency" tick={{ fill: '#475569', fontSize: window.innerWidth < 768 ? 9 : 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: '#64748b' }} tickCount={6} />
                    {showIdeal && (
                      <Radar name="理想" dataKey="理想" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
                    )}
                    {employees.filter(emp => selectedEmployees.includes(emp.id)).map(emp => (
                      <Radar key={emp.id} name={emp.name} dataKey={emp.name} stroke={emp.color} fill={emp.color} fillOpacity={0.3} strokeWidth={2} />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={400} className="md:h-[500px]">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: -90, left: -70 }}>
                    <rect x="50%" y="0" width="50%" height="50%" fill="#fecaca" opacity="0.12" />
                    <rect x="0" y="0" width="50%" height="50%" fill="#bfdbfe" opacity="0.12" />
                    <rect x="0" y="50%" width="50%" height="50%" fill="#fed7aa" opacity="0.12" />
                    <rect x="50%" y="50%" width="50%" height="50%" fill="#ddd6fe" opacity="0.12" />
                    <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#94a3b8" strokeWidth="2" />
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#94a3b8" strokeWidth="2" />
                    <XAxis type="number" dataKey="technical" name="テクニカル" domain={[0, 5]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="number" dataKey="human" name="ヒューマン" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <ZAxis range={[1500, 1500]} />

                     {/* 象限ラベル */}
                 <text x="75%" y="27%" textAnchor="middle" fill="#991b1b" fontSize="12">
                    高テクニカル・高ヒューマン
                  </text>
                  
                 <text x="25%" y="27%" textAnchor="middle" fill="#1e40af" fontSize="12">
                    低テクニカル・高ヒューマン
                  </text>
                  
                  <text x="25%" y="77%" textAnchor="middle" fill="#c2410c" fontSize="12">
                    低テクニカル・低ヒューマン
                  </text>
                  
                 <text x="75%" y="77%" textAnchor="middle" fill="#5b21b6" fontSize="12">
                    高テクニカル・低ヒューマン
                  </text>


                    <Tooltip cursor={false} content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-xl border-2 border-slate-300">
                            <p className="font-bold text-slate-800 mb-2">{data.name}</p>
                            <div className="space-y-1 text-xs">
                              <p><span className="font-semibold">テクニカル:</span> {data.technical}</p>
                              <p><span className="font-semibold">ヒューマン:</span> {data.human}</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Scatter data={calculateScatterData()} shape={(props) => {
                      const { cx, cy, fill, stroke, strokeWidth, strokeDasharray } = props;
                      return <circle cx={cx} cy={cy} r={window.innerWidth < 768 ? 8 : 12} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />;
                    }}>
                      {calculateScatterData().map((entry) => (
                        <Cell key={`cell-${entry.id}`} fill={entry.type === 'ideal' ? 'transparent' : entry.color} stroke={entry.type === 'ideal' ? entry.color : '#ffffff'} strokeWidth={4} strokeDasharray={entry.type === 'ideal' ? '8 4' : '0'} />
                      ))}
                    </Scatter>
                    <Legend 
  verticalAlign="bottom"
  wrapperStyle={{ marginTop: '-150px', marginLeft: '45px' }}  // ← 追加（数値で調整）
  content={() => (
    <div className="flex flex-wrap justify-center gap-4">
                        {calculateScatterData().map((entry) => (
                          <div key={entry.id} className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg">
                            <div className="w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs font-medium">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    )} />
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

rows="25"

/>

</div>
            </div>

            <div className="space-y-3">
              {showIdeal && (
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl shadow-lg pt-3 pb-0 px-4 md:px-6 border-2 border-slate-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <button onClick={() => setIdealProfile(prev => ({ ...prev, isExpanded: !prev.isExpanded }))} className="p-1 hover:bg-slate-100 rounded">
                        {idealProfile.isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-slate-400"></div>
                      <h3 className="text-lg md:text-xl font-bold text-slate-700">理想形（目標レベル）</h3>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="bg-white rounded-lg px-3 md:px-4 py-2 inline-block">
                      <div className="text-xs text-slate-600">平均スコア</div>
                      <div className="text-xl md:text-2xl font-bold text-slate-800">{calculateAverage(idealProfile)}</div>
                    </div>
                  </div>

                  {idealProfile.isExpanded && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(competencyNames).map(([key, name]) => (
                          <div key={key} className="flex items-center justify-between gap-2">
                            <label className="text-xs text-slate-600 flex-1">{name}</label>
                            <select value={idealProfile[key]} onChange={(e) => handleIdealChange(key, e.target.value)} className="w-16 px-2 py-1 border border-slate-300 rounded text-sm">
                              {[1, 2, 3, 4, 5].map(level => <option key={level} value={level}>Lv.{level}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-300">
                        <label className="text-xs text-slate-600 font-semibold mb-2 block">📝 メモ</label>
                        <textarea value={idealProfile.memo || ""} onChange={(e) => handleIdealMemoChange(e.target.value)} placeholder="目標設定の理由や達成時期" className="w-full px-3 py-2 border border-slate-300 rounded text-sm" rows="3" />
                      </div>
                    </>
                  )}
                </div>
              )}

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={employees.map(emp => emp.id)} strategy={verticalListSortingStrategy}>
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
        )}

{/* 履歴比較ビュー */}
        {viewMode === 'compare' && (
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 mb-4 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ArrowLeftRight className="w-6 h-6" />
              履歴比較
            </h2>

            {evaluationHistory.length < 2 ? (
              <div className="text-center py-12 text-slate-500">
                比較するには履歴が2件以上必要です
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">比較元</label>
                    <select
                      value={compareHistory1 || ''}
                      onChange={(e) => setCompareHistory1(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="">選択してください</option>
                      {evaluationHistory.map(history => (
                        <option key={history.id} value={history.id}>
                          {history.date} {history.memo && `- ${history.memo}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">比較先</label>
                    <select
                      value={compareHistory2 || ''}
                      onChange={(e) => setCompareHistory2(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="">選択してください</option>
                      {evaluationHistory.map(history => (
                        <option key={history.id} value={history.id}>
                          {history.date} {history.memo && `- ${history.memo}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(() => {
                  const compareData = prepareCompareData();
                  if (!compareData) return <div className="text-center py-8 text-slate-500">2つの履歴を選択してください</div>;

                  const { history1, history2 } = compareData;

                  return (
                    <div className="space-y-6">
                      {employees.map(emp => {
                        const emp1 = history1.data.employees.find(e => e.id === emp.id);
                        const emp2 = history2.data.employees.find(e => e.id === emp.id);
                        
                        if (!emp1 || !emp2) return null;

                        return (
                          <div key={emp.id} className="bg-slate-50 rounded-lg p-4 md:p-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: emp.color }} />
                              {emp.name}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                              {Object.entries(competencyNames).map(([key, name]) => {
                                const diff = calculateDifference(emp1.scores, emp2.scores, key);
                                return (
                                  <div key={key} className="bg-white p-3 rounded-lg">
                                    <div className="text-xs text-slate-600 mb-1">{name}</div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex gap-2 items-center">
                                        <span className="text-sm text-slate-500">Lv.{emp1.scores[key]}</span>
                                        <span className="text-slate-400">→</span>
                                        <span className="text-sm font-bold text-slate-800">Lv.{emp2.scores[key]}</span>
                                      </div>
                                      {diff !== 0 && (
                                        <span className={`text-xs font-bold ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {diff > 0 ? `+${diff}` : diff}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-3">
                              <div className="bg-white p-3 rounded">
                                <div className="text-xs text-slate-600">初回平均</div>
                                <div className="text-lg font-bold text-slate-800">{calculateAverage(emp1.scores)}</div>
                              </div>
                              <div className="bg-white p-3 rounded">
                                <div className="text-xs text-slate-600">現在平均</div>
                                <div className="text-lg font-bold text-slate-800">{calculateAverage(emp2.scores)}</div>
                              </div>
                              <div className={`p-3 rounded ${parseFloat(calculateAverage(emp2.scores)) > parseFloat(calculateAverage(emp1.scores)) ? 'bg-green-50' : 'bg-slate-50'}`}>
                                <div className={`text-xs ${parseFloat(calculateAverage(emp2.scores)) > parseFloat(calculateAverage(emp1.scores)) ? 'text-green-600' : 'text-slate-600'}`}>
                                  変化
                                </div>
                                <div className={`text-lg font-bold ${parseFloat(calculateAverage(emp2.scores)) > parseFloat(calculateAverage(emp1.scores)) ? 'text-green-700' : 'text-slate-800'}`}>
                                  {(parseFloat(calculateAverage(emp2.scores)) - parseFloat(calculateAverage(emp1.scores))).toFixed(1) > 0 ? '+' : ''}
                                  {(parseFloat(calculateAverage(emp2.scores)) - parseFloat(calculateAverage(emp1.scores))).toFixed(1)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* 時系列比較ビュー */}
        {viewMode === 'comparison' && (
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 mb-4 md:mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">📈 成長トレンド分析</h2>
            {evaluationHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                履歴が2件以上必要です。「現在の評価」タブから履歴を保存してください。
              </div>
            ) : (
              <div className="space-y-6 md:space-y-8">
                {employees.map(emp => {
                  const timeline = prepareTimelineData(emp.id);
                  if (timeline.length === 0) return null;

                  return (
                    <div key={emp.id} className="bg-slate-50 rounded-lg p-4 md:p-6">
                      <h3 className="font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: emp.color }} />
                        {emp.name}の成長推移
                      </h3>
                      
                      <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
                        <LineChart data={timeline}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: window.innerWidth < 768 ? 10 : 12 }} />
                          <YAxis domain={[0, 5]} />
                          <RechartsTooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="average" 
                            stroke={emp.color} 
                            strokeWidth={3}
                            name="平均スコア"
                          />
                          <Line type="monotone" dataKey="dataAnalysis" stroke="#8884d8" strokeWidth={2} name="データ分析" />
                          <Line type="monotone" dataKey="communication" stroke="#82ca9d" strokeWidth={2} name="コミュニケーション" />
                          <Line type="monotone" dataKey="strategy" stroke="#ffc658" strokeWidth={2} name="戦略立案" />
                        </LineChart>
                      </ResponsiveContainer>

                      {timeline.length > 1 && (
                        <div className="mt-4 grid grid-cols-3 gap-2 md:gap-3">
                          <div className="bg-white p-2 md:p-3 rounded">
                            <div className="text-xs text-slate-600">初回評価</div>
                            <div className="text-lg md:text-xl font-bold text-slate-800">
                              {timeline[0].average}
                            </div>
                          </div>
                          <div className="bg-white p-2 md:p-3 rounded">
                            <div className="text-xs text-slate-600">現在</div>
                            <div className="text-lg md:text-xl font-bold text-slate-800">
                              {timeline[timeline.length - 1].average}
                            </div>
                          </div>
                          <div className="bg-green-50 p-2 md:p-3 rounded">
                            <div className="text-xs text-green-600">成長率</div>
                            <div className="text-lg md:text-xl font-bold text-green-700">
                              +{(parseFloat(timeline[timeline.length - 1].average) - parseFloat(timeline[0].average)).toFixed(1)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* チーム分析ダッシュボード */}
        {viewMode === 'dashboard' && (
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 mb-4 md:mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">📊 チーム全体の分析</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 md:p-6">
                <div className="text-sm text-blue-600 mb-1">チーム平均スコア</div>
                <div className="text-2xl md:text-3xl font-bold text-blue-700">
                  {(() => {
                    const allAverages = employees.map(emp => parseFloat(calculateAverage(emp.scores)));
                    return (allAverages.reduce((a, b) => a + b, 0) / allAverages.length).toFixed(1);
                  })()}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 md:p-6">
                <div className="text-sm text-green-600 mb-1">最高スコア保持者</div>
                <div className="text-xl md:text-2xl font-bold text-green-700">
                  {(() => {
                    const sorted = [...employees].sort((a, b) => 
                      parseFloat(calculateAverage(b.scores)) - parseFloat(calculateAverage(a.scores))
                    );
                    return sorted[0].name;
                  })()}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 md:p-6">
                <div className="text-sm text-orange-600 mb-1">評価実施回数</div>
                <div className="text-2xl md:text-3xl font-bold text-orange-700">
                  {evaluationHistory.length + 1}回
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
              <div className="bg-green-50 rounded-lg p-4 md:p-6">
                <h3 className="font-bold text-green-800 mb-3 md:mb-4">💪 チームの強み TOP3</h3>
                <div className="space-y-2 md:space-y-3">
                  {topStrengths.map(([key, stat], index) => (
                    <div key={key} className="flex items-center justify-between bg-white p-2 md:p-3 rounded">
                      <div>
                        <div className="font-semibold text-sm md:text-base text-slate-800">{index + 1}. {stat.name}</div>
                        <div className="text-xs text-slate-600">
                          最高: Lv.{stat.max} / 最低: Lv.{stat.min}
                        </div>
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-green-600">
                        {stat.average}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 md:p-6">
                <h3 className="font-bold text-orange-800 mb-3 md:mb-4">📌 強化すべき領域 TOP3</h3>
                <div className="space-y-2 md:space-y-3">
                  {bottomWeaknesses.map(([key, stat], index) => (
                    <div key={key} className="flex items-center justify-between bg-white p-2 md:p-3 rounded">
                      <div>
                        <div className="font-semibold text-sm md:text-base text-slate-800">{index + 1}. {stat.name}</div>
                        <div className="text-xs text-slate-600">
                          最高: Lv.{stat.max} / 最低: Lv.{stat.min}
                        </div>
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-orange-600">
                        {stat.average}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 md:p-6">
              <h3 className="font-bold text-slate-800 mb-4">📋 全能力の詳細分析</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="text-left py-2 px-2 md:px-3">能力</th>
                      <th className="text-center py-2 px-2 md:px-3">平均</th>
                      <th className="text-center py-2 px-2 md:px-3">最高</th>
                      <th className="text-center py-2 px-2 md:px-3">最低</th>
                      <th className="text-center py-2 px-2 md:px-3">バラつき</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(teamStats).map(([key, stat]) => (
                      <tr key={key} className="border-b border-slate-200">
                        <td className="py-2 px-2 md:px-3 font-medium">{stat.name}</td>
                        <td className="text-center py-2 px-2 md:px-3 font-bold">{stat.average}</td>
                        <td className="text-center py-2 px-2 md:px-3">Lv.{stat.max}</td>
                        <td className="text-center py-2 px-2 md:px-3">Lv.{stat.min}</td>
                        <td className="text-center py-2 px-2 md:px-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            stat.range <= 1 ? 'bg-green-100 text-green-700' :
                            stat.range <= 2 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {stat.range}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 shadow-lg z-30">
          <button
            onClick={() => saveToSupabase(false)}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 text-sm"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '保存中...' : hasUnsavedChanges ? '保存する（未保存）' : '保存済み'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;