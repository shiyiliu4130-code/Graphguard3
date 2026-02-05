
import React, { useEffect, useRef, useState } from 'react';

const KnowledgeGraphECharts: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartInstance, setChartInstance] = useState<any>(null);
  const [isAnimationActive, setIsAnimationActive] = useState(true);
  const [highlightedRisk, setHighlightedRisk] = useState(false);
  const [fraudPatternsVisible, setFraudPatternsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nodeColors: Record<string, string> = {
    '正常用户': '#165DFF',
    '欺诈者': '#FF4D4F',
    '背景节点': '#8C8C8C'
  };

  const edgeColors: Record<string, string> = {
    '正常交易': '#165DFF',
    '异常交易': '#FF9F43',
    '可疑关联': '#FF4D4F'
  };

  const getGraphData = () => {
    const nodes = [
      { id: 'fraud_1', name: '欺诈者A', category: '欺诈者', symbolSize: 55, riskLevel: 'high', status: '逾期未还且失联' },
      { id: 'fraud_2', name: '欺诈者B', category: '欺诈者', symbolSize: 45, riskLevel: 'high', status: '逾期未还且失联' },
      { id: 'normal_1', name: '用户A', category: '正常用户', symbolSize: 32, riskLevel: 'low', status: '按时还款' },
      { id: 'normal_2', name: '用户B', category: '正常用户', symbolSize: 32, riskLevel: 'low', status: '按时还款' },
      { id: 'normal_3', name: '用户C', category: '正常用户', symbolSize: 30, riskLevel: 'low', status: '按时还款' },
      { id: 'bg_1', name: '设备节点1', category: '背景节点', symbolSize: 22, riskLevel: 'low', status: '共用同一设备' },
      { id: 'bg_2', name: 'IP节点2', category: '背景节点', symbolSize: 22, riskLevel: 'low', status: '共用同一IP' },
      { id: 'bg_4', name: '地理节点4', category: '背景节点', symbolSize: 22, riskLevel: 'low', status: '地理位置重合' }
    ];

    const edges = [
      { source: 'fraud_1', target: 'fraud_2', value: '8.5', category: '可疑关联' },
      { source: 'fraud_1', target: 'normal_1', value: '6.2', category: '异常交易' },
      { source: 'fraud_2', target: 'normal_2', value: '5.8', category: '异常交易' },
      { source: 'normal_1', target: 'normal_2', value: '2.0', category: '正常交易' },
      { source: 'normal_2', target: 'normal_3', value: '1.8', category: '正常交易' },
      { source: 'bg_1', target: 'fraud_1', value: '3.0', category: '可疑关联' },
      { source: 'bg_1', target: 'normal_1', value: '1.5', category: '正常交易' },
      { source: 'bg_2', target: 'normal_3', value: '1.2', category: '正常交易' },
      { source: 'bg_4', target: 'normal_2', value: '1.0', category: '正常交易' },
      { source: 'fraud_2', target: 'fraud_1', value: '2.5', category: '可疑关联' }
    ];

    return { nodes, edges };
  };

  const initChart = () => {
    if (!chartRef.current) return;
    
    const echarts = (window as any).echarts;
    if (!echarts) {
      setError('图表引擎正在加载或未找到，请稍后刷新重试');
      return;
    }

    try {
      const chart = echarts.init(chartRef.current);
      setChartInstance(chart);
      const data = getGraphData();

      const option = {
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#E8F3FF',
          borderWidth: 1,
          padding: [12, 16],
          textStyle: { color: '#1E293B', fontSize: 13 },
          formatter: (params: any) => {
            if (params.dataType === 'node') {
              return `<div style="font-family: system-ui;">
                <div style="font-weight: 900; color:${params.color}; border-bottom: 1px solid #F1F5F9; margin-bottom: 8px; padding-bottom: 4px;">${params.data.name}</div>
                <div style="display: flex; justify-content: space-between; gap: 20px;">
                  <span style="color: #64748B;">类别:</span>
                  <span style="font-weight: 700;">${params.data.category}</span>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 20px;">
                  <span style="color: #64748B;">状态:</span>
                  <span style="font-weight: 700;">${params.data.status}</span>
                </div>
              </div>`;
            }
            return `关系: <b>${params.data.category}</b><br/>关联强度: <b>${params.data.value}</b>`;
          }
        },
        series: [{
          type: 'graph',
          layout: 'force',
          data: data.nodes.map(n => ({
            ...n,
            itemStyle: { 
              color: nodeColors[n.category],
              shadowBlur: 10,
              shadowColor: 'rgba(0,0,0,0.1)'
            },
            label: { show: true, position: 'bottom', color: '#475569', fontSize: 12, fontWeight: 700, distance: 8 }
          })),
          links: data.edges.map(e => ({
            ...e,
            lineStyle: { 
              color: edgeColors[e.category], 
              width: 3, 
              curveness: 0.2, 
              type: e.category === '异常交易' ? 'dashed' : 'solid',
              opacity: 0.8
            },
            label: { show: false }
          })),
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: [0, 10],
          force: {
            repulsion: 1500,
            edgeLength: 220,
            layoutAnimation: isAnimationActive,
            gravity: 0.1
          },
          roam: true,
          draggable: true,
          emphasis: {
            focus: 'adjacency',
            lineStyle: { width: 6, opacity: 1 }
          }
        }]
      };

      chart.setOption(option);

      const handleResize = () => chart.resize();
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        chart.dispose();
      };
    } catch (e) {
      console.error('Chart Error:', e);
      setError('图表初始化异常');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      initChart();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const resetView = () => {
    chartInstance?.dispatchAction({ type: 'restore' });
    setHighlightedRisk(false);
    setFraudPatternsVisible(false);
  };

  const toggleRisk = () => {
    if (!chartInstance) return;
    const nextState = !highlightedRisk;
    setHighlightedRisk(nextState);
    const option = chartInstance.getOption();
    option.series[0].data = option.series[0].data.map((n: any) => ({
      ...n,
      itemStyle: {
        ...n.itemStyle,
        shadowBlur: nextState && n.category === '欺诈者' ? 40 : 10,
        shadowColor: nextState && n.category === '欺诈者' ? 'rgba(255, 77, 79, 1)' : 'rgba(0,0,0,0.1)'
      }
    }));
    chartInstance.setOption(option);
  };

  const showPatterns = () => {
    if (!chartInstance) return;
    const nextState = !fraudPatternsVisible;
    setFraudPatternsVisible(nextState);
    const option = chartInstance.getOption();
    option.series[0].links = option.series[0].links.map((l: any) => ({
      ...l,
      lineStyle: {
        ...l.lineStyle,
        width: nextState && l.category === '可疑关联' ? 8 : 3,
        opacity: nextState ? (l.category === '可疑关联' ? 1 : 0.1) : 0.8
      }
    }));
    chartInstance.setOption(option);
  };

  const zoom = (factor: number) => {
    if (!chartInstance) return;
    const option = chartInstance.getOption();
    const currentZoom = option.series[0].zoom || 1;
    option.series[0].zoom = currentZoom * factor;
    chartInstance.setOption(option);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E8F3FF] p-8 shadow-2xl overflow-hidden flex flex-col h-full min-h-[850px] relative">
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="text-red-500 font-black bg-white p-8 rounded-2xl shadow-2xl border border-red-100 flex flex-col items-center">
            <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Header Info Bar */}
      <div className="flex justify-between items-start mb-8 pb-8 border-b border-slate-100">
        <div className="space-y-6 flex-1">
          <div>
            <div className="flex items-center text-[#165DFF] font-black text-sm mb-4">
              <span className="w-2 h-5 bg-[#165DFF] rounded-full mr-3"></span> 节点分层定义
            </div>
            <div className="flex gap-10">
              <div className="flex items-center text-sm font-bold text-slate-500">
                <span className="w-4 h-4 rounded-md bg-[#165DFF] mr-3 shadow-lg shadow-blue-200"></span> 正常用户
              </div>
              <div className="flex items-center text-sm font-bold text-slate-500">
                <span className="w-4 h-4 rounded-md bg-[#FF4D4F] mr-3 shadow-lg shadow-red-200"></span> 欺诈黑名单
              </div>
              <div className="flex items-center text-sm font-bold text-slate-500">
                <span className="w-4 h-4 rounded-md bg-[#8C8C8C] mr-3 shadow-lg shadow-gray-200"></span> 关联资源
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 flex-1 border-l pl-10 border-slate-100">
          <div>
            <div className="flex items-center text-[#165DFF] font-black text-sm mb-4">
              <span className="w-2 h-5 bg-[#165DFF] rounded-full mr-3"></span> 关联强度分布
            </div>
            <div className="flex gap-10">
              <div className="flex items-center text-sm font-bold text-slate-500">
                <span className="w-10 h-[3px] bg-[#165DFF] mr-3"></span> 合规交易
              </div>
              <div className="flex items-center text-sm font-bold text-slate-500">
                <span className="w-10 h-[3px] border-b-2 border-dashed border-[#FF9F43] mr-3"></span> 频繁往来
              </div>
              <div className="flex items-center text-sm font-bold text-slate-500">
                <span className="w-10 h-[3px] bg-[#FF4D4F] mr-3"></span> 资金池关联
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Graph */}
      <div className="relative flex-1 min-h-[600px] bg-slate-50/30 rounded-2xl overflow-hidden border border-slate-50 shadow-inner">
        <div ref={chartRef} className="absolute inset-0 w-full h-full" />
        
        {/* Float Controls */}
        <div className="absolute top-6 right-6 flex flex-col gap-3 z-10">
          <button onClick={resetView} className="bg-white border border-slate-200 px-6 py-3 rounded-xl text-sm font-black text-blue-600 hover:bg-blue-50 transition-all shadow-xl active:scale-95">重置全局视图</button>
          <button onClick={toggleRisk} className={`border px-6 py-3 rounded-xl text-sm font-black transition-all shadow-xl active:scale-95 ${highlightedRisk ? 'bg-red-500 text-white border-red-500 scale-105' : 'bg-white text-blue-600 border-slate-200 hover:bg-blue-50'}`}>
            {highlightedRisk ? '取消预警高亮' : '高亮风险簇群'}
          </button>
          <button onClick={showPatterns} className={`border px-6 py-3 rounded-xl text-sm font-black transition-all shadow-xl active:scale-95 ${fraudPatternsVisible ? 'bg-orange-500 text-white border-orange-500 scale-105' : 'bg-white text-blue-600 border-slate-200 hover:bg-blue-50'}`}>
            {fraudPatternsVisible ? '隐藏欺诈链路' : '深度链路追踪'}
          </button>
          
          <div className="flex border border-slate-200 rounded-2xl shadow-xl bg-white overflow-hidden mt-4">
            <button onClick={() => zoom(1.2)} className="flex-1 py-3 text-blue-600 hover:bg-blue-50 transition-all border-r border-slate-100 text-xl font-black active:bg-blue-100">+</button>
            <button onClick={() => zoom(0.8)} className="flex-1 py-3 text-blue-600 hover:bg-blue-50 transition-all text-xl font-black active:bg-blue-100">-</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraphECharts;
