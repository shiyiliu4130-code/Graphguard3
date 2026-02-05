
import React, { useState, useEffect, useRef } from 'react';
import { FeatureStepInfo } from '../types';

const RiskAnalysisWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userId, setUserId] = useState('');
  const [featureProgress, setFeatureProgress] = useState(0);
  const [isProcessingFeatures, setIsProcessingFeatures] = useState(false);
  const [currentProcessStep, setCurrentProcessStep] = useState(-1);
  const [selectedModel, setSelectedModel] = useState('');
  const [isModelRunning, setIsModelRunning] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [riskResult, setRiskResult] = useState<any>(null);
  const d3Container = useRef<HTMLDivElement>(null);

  const stepInfo: FeatureStepInfo[] = [
    { 
      title: "正在执行: 数据清洗", 
      desc: "利用标准化流水处理算法，自动识别并修正数据中的缺失值、异常噪声及逻辑冲突，确保底层信贷数据的真实性与可用性。", 
      features: [0] 
    },
    { 
      title: "正在执行: 基础特征提取", 
      desc: "深度挖掘用户行为模式，从设备指纹、地理位置偏移、多头借贷历史等维度初步构建100+项基础风险指标。", 
      features: [1] 
    },
    { 
      title: "正在执行: 图结构特征转换", 
      desc: "将交易关联映射至高维空间，通过拉普拉斯变换提取网络拓扑特征，量化用户在团伙中的关联权重。", 
      features: [0, 1] 
    },
    { 
      title: "正在执行: 核心特征选择", 
      desc: "应用随机森林特征选择器，从海量维度中筛选出IV值最高、区分度最强的关键反欺诈特征子集。", 
      features: [2] 
    },
    { 
      title: "正在执行: 衍生特征生成", 
      desc: "基于图卷积网络预训练生成的Embedding向量，构建复杂衍生特征，识别传统手段难以察觉的隐蔽关联。", 
      features: [3] 
    }
  ];

  const modelOptions = [
    {
      id: 'GraphSAGE',
      name: 'GraphSAGE 算法',
      icon: 'fa-brain',
      desc: '归纳式图表示学习算法，能够利用节点属性信息高效生成未知节点的嵌入向量，特别适用于大规模动态变化的银行交易网络场景。'
    },
    {
      id: 'GAT2',
      name: 'GAT (图注意力网络)',
      icon: 'fa-microchip',
      desc: '引入多头注意力机制，能够自动为邻居节点分配不同权重，从而精准捕捉欺诈团伙中作为“首脑”的关键核心节点。'
    },
    {
      id: 'GSA',
      name: 'GSA 结构异常检测',
      icon: 'fa-network-wired',
      desc: '专注于挖掘图结构层面的畸变，通过分析全局拓扑特征识别潜在的集群性协同攻击，对白领结欺诈具有极高的敏感度。'
    }
  ];

  const resetAllSteps = () => {
    setCurrentStep(1);
    setUserId('');
    setFeatureProgress(0);
    setIsProcessingFeatures(false);
    setCurrentProcessStep(-1);
    setSelectedModel('');
    setIsModelRunning(false);
    setModelProgress(0);
    setRiskResult(null);
  };

  const startFeatureEngineering = () => {
    if (!userId.trim()) {
      alert('请先输入待研判的用户ID');
      return;
    }
    if (featureProgress === 100) return;
    setIsProcessingFeatures(true);
    let prog = 0;
    const interval = setInterval(() => {
      prog += 5;
      if (prog > 100) prog = 100;
      setFeatureProgress(prog);
      setCurrentProcessStep(Math.min(Math.floor(prog / 20.1), 4));
      if (prog >= 100) {
        clearInterval(interval);
        setIsProcessingFeatures(false);
      }
    }, 150);
  };

  const runModel = () => {
    if (!selectedModel) {
      alert('请先选择算法模型');
      return;
    }
    setIsModelRunning(true);
    setRiskResult(null);
    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        setIsModelRunning(false);
        setRiskResult({
          level: '中等风险',
          id: userId || 'U20260315007',
          confidence: (Math.random() * 10 + 85).toFixed(1) + '%',
          time: new Date().toLocaleString(),
          desc: `账户 ${userId} 在图谱中表现出明显的“中心放射型”关联，与已知逾期名单存在二度关联，建议通过人工电话进一步核实用途。`
        });
      }
      setModelProgress(prog);
    }, 250);
  };

  useEffect(() => {
    if (currentStep === 3 && d3Container.current) {
      const d3 = (window as any).d3;
      if (!d3) return;

      const container = d3Container.current;
      container.innerHTML = '';
      const width = container.clientWidth;
      const height = container.clientHeight || 500;

      const svg = d3.select(container).append("svg")
        .attr("width", width)
        .attr("height", height);

      const nodes = [
        { id: "user", name: `用户: ${userId}`, type: "user", risk: "中等", group: 0 },
        { id: "basic", name: "多头借贷特征", type: "feature", group: 1 },
        { id: "behavior", name: "非常规登录", type: "feature", group: 1 },
        { id: "social", name: "团伙核心关联", type: "feature", group: 1 },
        { id: "contact1", name: "疑似黑中介", type: "contact", group: 2 },
        { id: "device", name: "设备共享指纹", type: "device", group: 2 },
        { id: "risk1", name: "异常提现路径", type: "risk", group: 3 }
      ];

      const links = [
        { source: "user", target: "basic" },
        { source: "user", target: "behavior" },
        { source: "user", target: "social" },
        { source: "user", target: "contact1" },
        { source: "user", target: "device" },
        { source: "behavior", target: "risk1" }
      ];

      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id((d:any) => d.id).distance(130))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2));

      const link = svg.append("g").selectAll("line")
        .data(links).enter().append("line")
        .attr("stroke", "#e2e8f0").attr("stroke-opacity", 0.8).attr("stroke-width", 2);

      const node = svg.append("g").selectAll("g")
        .data(nodes).enter().append("g")
        .call(d3.drag()
          .on("start", (e:any, d:any) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on("drag", (e:any, d:any) => { d.fx = e.x; d.fy = e.y; })
          .on("end", (e:any, d:any) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

      node.append("circle")
        .attr("r", (d:any) => d.type === "user" ? 38 : 28)
        .attr("fill", (d:any) => {
          if(d.type === "user") return "#165DFF";
          if(d.type === "feature") return "#36F1CD";
          if(d.type === "risk") return "#FF4D4F";
          return "#FF9F43";
        })
        .attr("stroke", "#fff").attr("stroke-width", 3)
        .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.1))");

      node.append("text").text((d:any) => d.name).attr("text-anchor", "middle").attr("dy", 55).attr("font-size", "12px").attr("font-weight", "600").attr("fill", "#1e293b");

      simulation.on("tick", () => {
        link.attr("x1", (d:any) => d.source.x).attr("y1", (d:any) => d.source.y).attr("x2", (d:any) => d.target.x).attr("y2", (d:any) => d.target.y);
        node.attr("transform", (d:any) => `translate(${d.x}, ${d.y})`);
      });
    }
  }, [currentStep, userId]);

  return (
    <div className="p-8 space-y-8 animate-fadeIn max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#165DFF] to-[#0E42B3] p-8 rounded-2xl text-white shadow-xl flex justify-between items-center overflow-hidden relative">
        <div className="relative z-10">
          <h1 className="text-3xl font-black flex items-center mb-3">
            <i className="fas fa-shield-alt mr-4 text-4xl"></i> 风险识别研判控制台
          </h1>
          <p className="text-blue-100 max-w-2xl font-medium leading-relaxed">
            基于 GraphSAGE 与多头注意力机制的深度学习链路，对海量关联交易进行实时扫描与研判，精准识别隐藏在信贷网络中的团伙性欺诈行为。
          </p>
        </div>
        <div className="absolute right-[-20px] top-[-20px] opacity-10 text-[180px]">
          <i className="fas fa-microchip"></i>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="flex bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        {[
          { step: 1, title: '特征工程', desc: '自动化预处理与维度构建' },
          { step: 2, title: '模型研判', desc: '深度算法预测与风险评分' },
          { step: 3, title: '反欺诈识别', desc: '关联图谱可视化呈现' }
        ].map((item, idx) => (
          <div key={item.step} className={`flex-1 flex items-center relative ${idx < 2 ? 'after:content-[""] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-1/3 after:h-[2px] after:bg-gray-100' : ''}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black mr-5 z-10 transition-all duration-500 transform ${currentStep === item.step ? 'bg-[#165DFF] text-white rotate-3 shadow-lg scale-110' : currentStep > item.step ? 'bg-[#36F1CD] text-[#0E42B3]' : 'bg-gray-100 text-gray-400'}`}>
              {currentStep > item.step ? <i className="fas fa-check"></i> : item.step}
            </div>
            <div>
              <div className={`font-black text-lg ${currentStep === item.step ? 'text-[#165DFF]' : 'text-gray-600'}`}>{item.title}</div>
              <div className="text-xs text-gray-400 font-bold">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-50 min-h-[600px] flex flex-col">
        {currentStep === 1 && (
          <div className="space-y-10 animate-fadeIn flex-1">
            <div className="flex items-center justify-between border-b pb-6">
              <h2 className="text-2xl font-black text-[#0E42B3]">特征工程流水线</h2>
              <span className="bg-blue-50 text-[#165DFF] px-4 py-1 rounded-full text-xs font-bold">Pipeline Active</span>
            </div>

            {/* User ID Input Section */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-end gap-6 shadow-inner">
              <div className="flex-1 space-y-3">
                <label className="block text-sm font-black text-[#0E42B3] uppercase tracking-wider">请输入待研判用户 ID</label>
                <div className="relative">
                  <i className="fas fa-user-tag absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                  <input 
                    type="text" 
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    disabled={isProcessingFeatures || featureProgress === 100}
                    placeholder="例如: USER_8829103"
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-white bg-white shadow-sm outline-none focus:border-[#165DFF] transition-all font-bold text-gray-700 placeholder:text-gray-200"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-400 font-bold mb-4 italic">
                * 系统将根据输入的 ID 自动调取关联节点数据
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-4 relative">
              {[
                { name: '清洗', sub: 'Data Cleaning' },
                { name: '提取', sub: 'Extraction' },
                { name: '转换', sub: 'Transform' },
                { name: '选择', sub: 'Selection' },
                { name: '生成', sub: 'Generation' }
              ].map((s, idx) => (
                <div key={idx} className="flex flex-col items-center relative z-10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black border-4 transition-all duration-500 ${currentProcessStep >= idx ? 'bg-[#36F1CD] border-white text-white shadow-md' : currentProcessStep === idx - 1 ? 'bg-[#165DFF] border-white text-white animate-pulse' : 'bg-white border-gray-100 text-gray-300'}`}>
                    {idx + 1}
                  </div>
                  <div className={`mt-3 text-sm font-black ${currentProcessStep >= idx ? 'text-[#165DFF]' : 'text-gray-400'}`}>{s.name}</div>
                  <div className="text-[10px] text-gray-300 font-bold uppercase">{s.sub}</div>
                </div>
              ))}
              <div className="absolute top-6 left-10 right-10 h-[2px] bg-gray-100 -z-0"></div>
            </div>

            <div className="max-w-3xl mx-auto space-y-6 py-10">
              {featureProgress > 0 ? (
                <div className="bg-[#f8faff] p-8 rounded-2xl border-l-8 border-[#165DFF] shadow-inner transform transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-black text-[#165DFF] text-lg">{stepInfo[currentProcessStep]?.title || "准备就绪"}</span>
                    <span className="text-sm font-bold text-gray-400">{featureProgress}% 完成</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed font-medium mb-6">
                    {stepInfo[currentProcessStep]?.desc || "点击按钮开始处理流程。"}
                  </p>
                  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden p-1 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-[#165DFF] to-[#36F1CD] transition-all duration-300 rounded-full shadow-lg" style={{ width: `${featureProgress}%` }}></div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                  <i className="fas fa-database text-gray-200 text-5xl mb-6"></i>
                  <p className="text-gray-400 font-bold">准备就绪，待输入用户ID后启动流水线</p>
                </div>
              )}
              
              <div className="flex justify-center">
                <button 
                  onClick={startFeatureEngineering} 
                  disabled={isProcessingFeatures || !userId.trim()} 
                  className={`px-12 py-4 rounded-xl font-black text-lg transition-all shadow-xl active:scale-95 ${featureProgress === 100 ? 'bg-[#36F1CD] text-[#0E42B3]' : 'bg-[#165DFF] text-white hover:bg-[#0E42B3] disabled:opacity-50 disabled:grayscale'}`}
                >
                  {featureProgress === 100 ? '流水线处理已完成' : isProcessingFeatures ? '特征提取引擎运行中...' : '启动特征工程流水线'}
                </button>
              </div>
            </div>

            <div className="mt-auto flex justify-end">
              <button onClick={() => setCurrentStep(2)} disabled={featureProgress < 100} className="px-10 py-3 rounded-xl font-black bg-[#165DFF] text-white shadow-lg disabled:bg-gray-100 disabled:text-gray-300 transition-all">
                进入模型研判 <i className="fas fa-chevron-right ml-2"></i>
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-10 animate-fadeIn flex-1">
            <div className="flex items-center justify-between border-b pb-6">
              <h2 className="text-2xl font-black text-[#0E42B3]">模型预测引擎 (用户: {userId})</h2>
              <span className="bg-orange-50 text-orange-500 px-4 py-1 rounded-full text-xs font-bold">选择算法模型</span>
            </div>

            <div className="grid grid-cols-3 gap-8">
              {modelOptions.map((model) => (
                <div 
                  key={model.id} 
                  onClick={() => !isModelRunning && setSelectedModel(model.id)} 
                  className={`group p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-2 ${selectedModel === model.id ? 'border-[#165DFF] bg-[#F5F8FF] shadow-xl' : 'border-gray-100 bg-white hover:border-[#165DFF]/30'}`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6 transition-all ${selectedModel === model.id ? 'bg-[#165DFF] text-white shadow-lg rotate-12' : 'bg-gray-50 text-gray-400 group-hover:bg-[#165DFF]/10 group-hover:text-[#165DFF]'}`}>
                    <i className={`fas ${model.icon}`}></i>
                  </div>
                  <h3 className={`text-xl font-black mb-3 ${selectedModel === model.id ? 'text-[#165DFF]' : 'text-gray-700'}`}>{model.name}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-medium">
                    {model.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              {isModelRunning && (
                <div className="text-center py-6">
                  <div className="font-black text-[#165DFF] mb-2">算法推理中: {modelProgress}%</div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#165DFF] transition-all duration-100" style={{ width: `${modelProgress}%` }}></div>
                  </div>
                </div>
              )}

              {riskResult && (
                <div className="bg-[#FFF8F0] p-8 rounded-2xl border-2 border-orange-200 shadow-lg animate-fadeIn">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 mr-4">
                      <i className="fas fa-exclamation-circle text-xl"></i>
                    </div>
                    <div>
                      <div className="text-xs font-black text-orange-400 uppercase">研判结果输出</div>
                      <div className="text-xl font-black text-orange-600">该用户判定为: {riskResult.level} (置信度 {riskResult.confidence})</div>
                    </div>
                  </div>
                  <p className="text-orange-900/70 text-sm font-bold leading-relaxed">{riskResult.desc}</p>
                </div>
              )}
            </div>

            <div className="mt-auto flex justify-between">
              <button onClick={() => setCurrentStep(1)} className="px-10 py-3 rounded-xl font-black border border-gray-200 text-gray-400 hover:bg-gray-50">上一步</button>
              <div className="space-x-4">
                <button onClick={runModel} disabled={isModelRunning || !selectedModel} className="px-10 py-3 rounded-xl font-black border-2 border-[#165DFF] text-[#165DFF] hover:bg-[#165DFF] hover:text-white transition-all disabled:opacity-30">运行研判推理</button>
                <button onClick={() => setCurrentStep(3)} disabled={!riskResult} className="px-10 py-3 rounded-xl font-black bg-[#165DFF] text-white shadow-lg disabled:opacity-30 transition-all">进入可视化识别</button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b pb-6 shrink-0">
              <h2 className="text-2xl font-black text-[#0E42B3]">欺诈团伙路径识别 (用户: {userId})</h2>
              <div className="flex gap-4">
                <div className="flex items-center text-xs font-bold text-gray-500"><span className="w-3 h-3 rounded-full bg-[#165DFF] mr-2"></span>用户</div>
                <div className="flex items-center text-xs font-bold text-gray-500"><span className="w-3 h-3 rounded-full bg-[#36F1CD] mr-2"></span>特征项</div>
                <div className="flex items-center text-xs font-bold text-gray-500"><span className="w-3 h-3 rounded-full bg-[#FF4D4F] mr-2"></span>风险源</div>
              </div>
            </div>
            
            <div className="relative flex-1 bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden">
               <div ref={d3Container} className="absolute inset-0"></div>
               <div className="absolute top-6 left-6 p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-white shadow-lg max-w-[240px]">
                 <div className="text-xs font-black text-[#165DFF] mb-2 uppercase">图计算引擎结果</div>
                 <div className="text-sm text-gray-700 leading-relaxed font-bold">
                   发现该用户 <span className="text-[#165DFF]">{userId}</span> 位于一个由 <span className="text-red-500">32个强关联节点</span> 构成的闭合交易环中，呈现典型的信贷工厂代办特征。
                 </div>
               </div>
            </div>

            <div className="mt-auto flex justify-between shrink-0 pt-6">
              <button onClick={() => setCurrentStep(2)} className="px-10 py-3 rounded-xl font-black border border-gray-200 text-gray-400">返回模型调整</button>
              <button onClick={() => {
                alert(`识别记录 ${userId} 已归档至系统风险库，正在重置以进行下一轮研判。`);
                resetAllSteps();
              }} className="px-10 py-3 rounded-xl font-black bg-[#36F1CD] text-[#0E42B3] shadow-lg shadow-[#36F1CD]/30 transition-all hover:scale-105 active:scale-95">提交研判记录</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskAnalysisWizard;
