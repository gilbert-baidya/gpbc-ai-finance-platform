import React from 'react';
import { Lightbulb, AlertTriangle, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { GlassPanel, LoadingSkeleton } from './ui';

const InsightCard = ({ icon: Icon, title, content, colorClass, delay }) => (
    <div
        className={`flex gap-4 p-4 rounded-2xl bg-opacity-5 border border-white/10 transition-all hover:bg-opacity-10 animate-fade-in ${colorClass}`}
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className={`p-2 rounded-xl h-fit ${colorClass.replace('bg-', 'bg-opacity-20 bg-')}`}>
            <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
        </div>
        <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">{title}</h4>
            <p className="text-sm leading-relaxed text-primary/90">{content}</p>
        </div>
        <ChevronRight size={16} className="text-muted/30 self-center" />
    </div>
);

export const AiInsightPanel = ({ loading, data, error }) => {
    if (loading) {
        return (
            <GlassPanel className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-wine animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest text-wine">Generating Intelligence...</span>
                </div>
                <LoadingSkeleton className="h-24 w-full" />
                <LoadingSkeleton className="h-24 w-full" />
                <LoadingSkeleton className="h-24 w-full" />
            </GlassPanel>
        );
    }

    if (error || !data) {
        return (
            <GlassPanel className="flex flex-col items-center justify-center p-8 text-center bg-red-50/10">
                <AlertTriangle size={32} className="text-red-400 mb-2" />
                <p className="text-sm text-muted">Strategic insights are currently offline. Check connection to AI Engine.</p>
            </GlassPanel>
        );
    }

    return (
        <GlassPanel className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-wine" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-wine">AI Strategic Analysis</h3>
                </div>
                <div className="px-2 py-0.5 rounded text-[10px] bg-wine/10 text-wine font-medium">REAL-TIME</div>
            </div>

            <div className="space-y-3">
                <InsightCard
                    icon={Lightbulb}
                    title="Financial Insight"
                    content={data.insight}
                    colorClass="bg-blue-600"
                    delay={0}
                />
                <InsightCard
                    icon={AlertTriangle}
                    title="Risk Alert"
                    content={data.risk}
                    colorClass="bg-red-600"
                    delay={100}
                />
                <InsightCard
                    icon={TrendingUp}
                    title="Ministry Opportunity"
                    content={data.opportunity}
                    colorClass="bg-green-600"
                    delay={200}
                />
            </div>
        </GlassPanel>
    );
};
