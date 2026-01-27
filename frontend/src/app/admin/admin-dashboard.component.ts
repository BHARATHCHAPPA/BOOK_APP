import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
   selector: 'app-admin-dashboard',
   standalone: true,
   imports: [CommonModule],
   template: `
    <div class="admin-container">
      <header class="admin-header">
        <div>
          <h1>Executive Pulse</h1>
          <p class="subtitle">Real-time SaaS Health Check</p>
        </div>
        <div class="time-toggle">
           <button class="active">Today</button>
           <button>Last 7d</button>
           <button>Last 30d</button>
        </div>
      </header>

      <!-- SECTION 1: Executive Snapshot (Top Row) -->
      <div class="snapshot-grid">
         <!-- Revenue -->
         <div class="card metric-card">
            <h3>Gross Revenue</h3>
            <div class="value">$2,450</div>
            <div class="trend up">▲ 12% vs yesterday</div>
         </div>
         <div class="card metric-card">
            <h3>Net Revenue</h3>
            <div class="value">$2,108</div>
            <div class="sub-text">(after Stripe fees)</div>
         </div>
         
         <!-- Orders -->
         <div class="card metric-card">
            <h3>Total Orders</h3>
            <div class="value">84</div>
            <div class="trend up">▲ 5%</div>
         </div>
         <div class="card metric-card">
            <h3>Avg Order Value</h3>
            <div class="value">$29.15</div>
         </div>

         <!-- Customers -->
         <div class="card metric-card">
            <h3>New Customers</h3>
            <div class="value">62</div>
            <div class="trend up">▲ 8%</div>
         </div>
         <div class="card metric-card">
            <h3>StoryMaker Adoption</h3>
            <div class="value">34%</div>
            <div class="sub-text">Tier 2 uptake is healthy</div>
         </div>

         <!-- Red Flags -->
         <div class="card metric-card danger-border">
            <h3>Red Flags</h3>
            <div class="flex-row">
               <span>Refunds: <b class="red">1</b></span>
               <span>Chargebacks: <b class="red">0</b></span>
            </div>
            <div class="sub-text red">1 Failed Payment (24h)</div>
         </div>
      </div>

      <!-- SECTION 2 & 3: Mix & Funnel -->
      <div class="mid-grid">
         <!-- Sales & Product Mix -->
         <div class="card">
            <h2>Product Mix</h2>
            <div class="mix-table">
               <div class="row header">
                  <span>Product</span>
                  <span>Orders</span>
                  <span>Revenue</span>
               </div>
               <div class="row">
                  <span>Name Book (Tier 1)</span>
                  <span>45</span>
                  <span>$1,125</span>
               </div>
               <div class="row highlight">
                  <span>StoryMaker (Tier 2)</span>
                  <span>28</span>
                  <span>$980</span>
               </div>
               <div class="row">
                  <span>Add-ons (Credits/Slots)</span>
                  <span>11</span>
                  <span>$345</span>
               </div>
            </div>
            <div class="insight-box">
                <strong>Insight:</strong> Upsell conversion (Name -> Add-ons) is at 18%.
            </div>
         </div>

         <!-- Funnel Health -->
         <div class="card">
            <h2>Funnel Health</h2>
            <div class="funnel-steps">
               <div class="step">
                  <span class="label">Visitors</span>
                  <span class="count">1,240</span>
               </div>
               <div class="arrow">↓ 12% Started Checkout</div>
               <div class="step">
                  <span class="label">Checkout Started</span>
                  <span class="count">148</span>
               </div>
               <div class="arrow">↓ 56% Completed</div>
               <div class="step success">
                  <span class="label">Purchases</span>
                  <span class="count">84</span>
               </div>
            </div>
            <div class="abandoned-alert">
               ⚠️ 64 Abandoned Carts Today
            </div>
         </div>
      </div>

      <!-- SECTION 5: Alerts & Action Items -->
      <div class="alerts-section">
         <h2>⚠️ Alerts & Action Items (Founder Brain)</h2>
         <div class="alert-list">
             <div class="alert-item critical">
                <span class="icon">🔥</span>
                <span class="msg">5 Chargebacks need review immediately</span>
                <button>Review</button>
             </div>
             <div class="alert-item warn">
                <span class="icon">⚠️</span>
                <span class="msg">12 Users have 0 save slots remaining (Churn Risk)</span>
                <button>View Users</button>
             </div>
             <div class="alert-item info">
                <span class="icon">ℹ️</span>
                <span class="msg">StoryMaker conversion dropped 12% this week</span>
                <button>Analyze Funnel</button>
             </div>
         </div>
      </div>

      <!-- SECTION 4: Engagement Signals -->
      <div class="card engagement-card">
         <h2>Engagement Signals (Last 24h)</h2>
         <div class="signal-grid">
            <div class="signal">
               <span class="val">120</span>
               <span class="lbl">Books Created</span>
            </div>
            <div class="signal">
               <span class="val">45</span>
               <span class="lbl">New Versions</span>
            </div>
            <div class="signal">
               <span class="val">12</span>
               <span class="lbl">AI Narrations</span>
            </div>
            <div class="signal">
               <span class="val">310</span>
               <span class="lbl">Credits Spent</span>
            </div>
         </div>
      </div>

    </div>
  `,
   styles: [`
    .admin-container { padding: 2rem; background: #f0f2f5; min-height: 100vh; font-family: 'Inter', sans-serif; }
    
    .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    h1 { margin: 0; font-size: 1.8rem; color: #1a202c; }
    .subtitle { margin: 0; color: #718096; }
    h2 { font-size: 1.2rem; color: #2d3748; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }

    .time-toggle button {
        background: white; border: 1px solid #cbd5e0; padding: 0.5rem 1rem; cursor: pointer;
    }
    .time-toggle button.active { background: #3182ce; color: white; border-color: #3182ce; }
    .time-toggle button:first-child { border-radius: 6px 0 0 6px; }
    .time-toggle button:last-child { border-radius: 0 6px 6px 0; }

    /* Snapshot Grid */
    .snapshot-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    
    .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .metric-card h3 { margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #718096; text-transform: uppercase; letter-spacing: 0.05em; }
    .value { font-size: 1.8rem; font-weight: 700; color: #2d3748; }
    .trend { font-size: 0.85rem; margin-top: 0.25rem; }
    .trend.up { color: #38a169; }
    .trend.down { color: #e53e3e; }
    .sub-text { font-size: 0.8rem; color: #a0aec0; margin-top: 0.25rem; }
    .danger-border { border-left: 4px solid #e53e3e; }
    .red { color: #e53e3e; font-weight: bold; }
    .flex-row { display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.9rem; }

    /* Mid Grid */
    .mid-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-bottom: 2rem; }
    @media (max-width: 1000px) { .mid-grid { grid-template-columns: 1fr; } }

    /* Mix Table */
    .mix-table .row { display: grid; grid-template-columns: 2fr 1fr 1fr; padding: 0.75rem 0; border-bottom: 1px solid #edf2f7; }
    .mix-table .header { font-weight: 600; color: #718096; font-size: 0.85rem; border-bottom: 2px solid #e2e8f0; }
    .mix-table .highlight { background: #ebf8ff; border-radius: 4px; padding-left: 0.5rem; padding-right: 0.5rem; margin-left: -0.5rem; margin-right: -0.5rem; }
    .insight-box { margin-top: 1rem; background: #fffaf0; padding: 1rem; border-left: 4px solid #ed8936; font-size: 0.9rem; color: #744210; }

    /* Funnel */
    .funnel-steps { display: flex; flex-direction: column; align-items: center; }
    .step { width: 100%; border: 1px solid #e2e8f0; padding: 1rem; text-align: center; border-radius: 8px; background: #f7fafc; }
    .step.success { background: #f0fff4; border-color: #9ae6b4; }
    .step .count { display: block; font-size: 1.5rem; font-weight: 700; margin-top: 0.25rem; }
    .arrow { color: #718096; font-size: 0.85rem; margin: 0.5rem 0; }
    .abandoned-alert { margin-top: 1rem; color: #c53030; background: #fff5f5; padding: 0.5rem; border-radius: 4px; text-align: center; font-weight: 600; font-size: 0.9rem; }

    /* Alerts */
    .alerts-section { margin-bottom: 2rem; }
    .alert-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .alert-item { display: flex; align-items: center; padding: 1rem; border-radius: 8px; background: white; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .alert-item.critical { border-left: 4px solid #e53e3e; }
    .alert-item.warn { border-left: 4px solid #ecc94b; }
    .alert-item.info { border-left: 4px solid #3182ce; }
    .alert-item .icon { font-size: 1.2rem; margin-right: 1rem; }
    .alert-item .msg { flex-grow: 1; font-weight: 500; color: #2d3748; }
    .alert-item button { padding: 0.4rem 1rem; border: 1px solid #e2e8f0; background: white; border-radius: 4px; cursor: pointer; color: #4a5568; }
    .alert-item button:hover { background: #edf2f7; }

    /* Engagement */
    .signal-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; text-align: center; }
    .signal { background: #f7fafc; padding: 1rem; border-radius: 8px; }
    .signal .val { display: block; font-size: 1.8rem; font-weight: 700; color: #553c9a; }
    .signal .lbl { font-size: 0.85rem; color: #718096; text-transform: uppercase; letter-spacing: 0.05em; }
  `]
})
export class AdminDashboardComponent implements OnInit {
   constructor() { }
   ngOnInit() { }
}
