import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { fetchAuthSession } from 'aws-amplify/auth';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
   selector: 'app-admin-dashboard',
   standalone: true,
   imports: [CommonModule, FormsModule],
   template: `
    <div class="flex h-screen bg-gray-50 font-sans">
      
      <!-- Sidebar -->
      <aside class="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
          <div class="h-16 flex items-center px-6 border-b border-gray-100">
             <div class="text-xl font-bold text-indigo-600 tracking-tight">Admin<span class="text-gray-800">Pulse</span></div>
          </div>
          
          <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
             <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Main</div>
             <a (click)="view = 'DASH'" [class.bg-indigo-50]="view === 'DASH'" [class.text-indigo-600]="view === 'DASH'" class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                 <span class="text-lg">📊</span> Dashboard
             </a>
             <a (click)="loadUsers()" [class.bg-indigo-50]="view === 'USERS'" [class.text-indigo-600]="view === 'USERS'" class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                 <span class="text-lg">👥</span> User Management
             </a>

             <div class="mt-8 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Analytics</div>
             <a class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-400 hover:text-gray-600 cursor-not-allowed">
                 <span class="text-lg">📈</span> Revenue (Soon)
             </a>
             <a class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-400 hover:text-gray-600 cursor-not-allowed">
                 <span class="text-lg">🛒</span> Orders (Soon)
             </a>
          </nav>

          <div class="p-4 border-t border-gray-100">
             <button (click)="goBack()" class="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <span>🚪</span> Exit Admin
             </button>
          </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col overflow-hidden">
          
          <!-- Top Header -->
          <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8">
              <div class="flex items-center gap-4">
                  <h1 class="text-lg font-bold text-gray-800">{{ view === 'DASH' ? 'Executive Overview' : 'User Management' }}</h1>
                  <span *ngIf="loading" class="text-xs text-indigo-500 animate-pulse font-medium">Updating...</span>
              </div>
              <div class="flex items-center gap-2">
                 <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">AD</div>
              </div>
          </header>

          <!-- Scrollable View Area -->
          <div class="flex-1 overflow-y-auto p-6 lg:p-8">
              
              <!-- VIEW: DASHBOARD -->
              <div *ngIf="view === 'DASH'" class="space-y-6 animate-fade-in">
                  
                  <!-- Top Stats Row -->
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <!-- Card 1 -->
                      <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div class="flex justify-between items-start mb-4">
                              <div class="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                  <span class="text-xl">💰</span>
                              </div>
                              <span class="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700">▲ 11.01%</span>
                          </div>
                          <div class="text-2xl font-bold text-gray-900">$3,782</div>
                          <div class="text-sm text-gray-500 mt-1">Total Revenue</div>
                      </div>

                      <!-- Card 2 -->
                      <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div class="flex justify-between items-start mb-4">
                              <div class="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                  <span class="text-xl">🛒</span>
                              </div>
                              <span class="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700">▲ 9.05%</span>
                          </div>
                          <div class="text-2xl font-bold text-gray-900">5,359</div>
                          <div class="text-sm text-gray-500 mt-1">Total Orders</div>
                      </div>

                      <!-- Card 3 -->
                      <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                          <div class="flex justify-between items-start mb-4">
                              <div class="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                                  <span class="text-xl">👥</span>
                              </div>
                              <span class="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700">▲ 5.2%</span>
                          </div>
                          <div class="text-2xl font-bold text-gray-900">1,249</div>
                          <div class="text-sm text-gray-500 mt-1">Active Users</div>
                      </div>

                      <!-- Card 4 -->
                      <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                         <div class="flex justify-between items-start mb-4">
                              <div class="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                  <span class="text-xl">⚠️</span>
                              </div>
                              <span class="text-xs font-medium px-2 py-1 rounded-full bg-red-50 text-red-700">Action Reqd</span>
                          </div>
                          <div class="text-2xl font-bold text-gray-900">3</div>
                          <div class="text-sm text-gray-500 mt-1">Pending Alerts</div>
                      </div>
                  </div>

                  <!-- Charts / Big Sections -->
                  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <!-- Monthly Sales (Big Bar Chart Placeholder) -->
                      <div class="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                          <div class="flex items-center justify-between mb-6">
                              <h3 class="font-bold text-gray-800">Monthly Sales</h3>
                              <button class="text-gray-400 hover:text-gray-600">•••</button>
                          </div>
                          <div class="h-64 flex items-end justify-between gap-2 px-2">
                              <!-- Fake Bars with Tailwind heights -->
                              <div class="w-full bg-indigo-50 rounded-t-sm hover:bg-indigo-100 transition-colors group relative" style="height: 40%">
                                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block text-xs bg-gray-800 text-white px-2 py-1 rounded">40%</div>
                              </div>
                              <div class="w-full bg-indigo-500 rounded-t-sm shadow-lg hover:bg-indigo-600 transition-colors" style="height: 75%"></div>
                              <div class="w-full bg-indigo-50 rounded-t-sm hover:bg-indigo-100 transition-colors" style="height: 55%"></div>
                              <div class="w-full bg-indigo-50 rounded-t-sm hover:bg-indigo-100 transition-colors" style="height: 80%"></div>
                              <div class="w-full bg-indigo-50 rounded-t-sm hover:bg-indigo-100 transition-colors" style="height: 45%"></div>
                              <div class="w-full bg-indigo-50 rounded-t-sm hover:bg-indigo-100 transition-colors" style="height: 60%"></div>
                              <div class="w-full bg-indigo-500 rounded-t-sm shadow-lg hover:bg-indigo-600 transition-colors" style="height: 90%"></div>
                              <div class="w-full bg-indigo-50 rounded-t-sm hover:bg-indigo-100 transition-colors" style="height: 65%"></div>
                              <div class="w-full bg-indigo-50 rounded-t-sm hover:bg-indigo-100 transition-colors" style="height: 50%"></div>
                              <div class="w-full bg-indigo-50 rounded-t-sm hover:bg-indigo-100 transition-colors" style="height: 70%"></div>
                              <div class="w-full bg-indigo-50 rounded-t-sm hover:bg-indigo-100 transition-colors" style="height: 85%"></div>
                              <div class="w-full bg-indigo-50 rounded-t-sm hover:bg-indigo-100 transition-colors" style="height: 55%"></div>
                          </div>
                          <div class="flex justify-between mt-4 text-xs text-gray-400 font-medium uppercase">
                              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                              <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                          </div>
                      </div>

                      <!-- Monthly Target (Gauge Placeholder) -->
                      <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                          <h3 class="font-bold text-gray-800 self-start mb-2">Monthly Target</h3>
                          <p class="text-sm text-gray-500 self-start mb-8">Target you've set for each month</p>
                          
                          <div class="relative w-48 h-24 overflow-hidden mb-4">
                             <div class="w-48 h-48 rounded-full border-[12px] border-indigo-100 border-t-indigo-500 border-r-indigo-500 transform -rotate-45 box-border"></div>
                             <div class="absolute bottom-0 left-1/2 -translate-x-1/2 text-2xl font-bold text-gray-800">75.55%</div>
                          </div>
                          
                          <p class="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full mb-4">+10%</p>
                          <p class="text-xs text-gray-400 max-w-[200px] leading-relaxed">You earn $3,287 today, it's higher than last month.</p>
                          
                          <div class="grid grid-cols-3 gap-4 w-full mt-8 pt-6 border-t border-gray-100">
                             <div>
                                <div class="text-xs text-gray-400 mb-1">Target</div>
                                <div class="font-bold text-gray-800">$20k ▼</div>
                             </div>
                             <div>
                                <div class="text-xs text-gray-400 mb-1">Revenue</div>
                                <div class="font-bold text-gray-800">$16k ▲</div>
                             </div>
                             <div>
                                <div class="text-xs text-gray-400 mb-1">Today</div>
                                <div class="font-bold text-gray-800">$1.2k ▲</div>
                             </div>
                          </div>
                      </div>
                  </div>

                  <!-- Recent Orders Table -->
                  <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      <div class="p-6 border-b border-gray-50 flex justify-between items-center">
                          <h3 class="font-bold text-gray-800">Recent Orders</h3>
                          <button class="text-sm text-indigo-600 font-medium hover:text-indigo-700">See All</button>
                      </div>
                      <div class="overflow-x-auto">
                          <table class="w-full text-left border-collapse">
                             <thead class="bg-gray-50 text-xs uppercase text-gray-400 font-semibold">
                                <tr>
                                   <th class="px-6 py-4">Product Name</th>
                                   <th class="px-6 py-4">Category</th>
                                   <th class="px-6 py-4">Price</th>
                                   <th class="px-6 py-4">Status</th>
                                </tr>
                             </thead>
                             <tbody class="divide-y divide-gray-50">
                                <tr class="hover:bg-gray-50/50 transition-colors group">
                                   <td class="px-6 py-4 font-medium text-gray-800 flex items-center gap-3">
                                      <div class="h-10 w-10 rounded bg-gray-100"></div> MacBook Pro 13"
                                   </td>
                                   <td class="px-6 py-4 text-gray-500">Laptop</td>
                                   <td class="px-6 py-4 text-gray-800 font-bold">$2,399</td>
                                   <td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600">Delivered</span></td>
                                </tr>
                                <tr class="hover:bg-gray-50/50 transition-colors group">
                                   <td class="px-6 py-4 font-medium text-gray-800 flex items-center gap-3">
                                      <div class="h-10 w-10 rounded bg-gray-100"></div> Apple Watch Ultra
                                   </td>
                                   <td class="px-6 py-4 text-gray-500">Watch</td>
                                   <td class="px-6 py-4 text-gray-800 font-bold">$879</td>
                                   <td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-600">Pending</span></td>
                                </tr>
                                <tr class="hover:bg-gray-50/50 transition-colors group">
                                   <td class="px-6 py-4 font-medium text-gray-800 flex items-center gap-3">
                                      <div class="h-10 w-10 rounded bg-gray-100"></div> iPhone 15 Pro
                                   </td>
                                   <td class="px-6 py-4 text-gray-500">Smartphone</td>
                                   <td class="px-6 py-4 text-gray-800 font-bold">$1,299</td>
                                   <td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600">Shipped</span></td>
                                </tr>
                             </tbody>
                          </table>
                      </div>
                  </div>

              </div>

              <!-- VIEW: USER MANAGEMENT -->
              <div *ngIf="view === 'USERS'" class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
                  <div class="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                      <div>
                          <h3 class="font-bold text-gray-800 text-lg">System Users</h3>
                          <p class="text-sm text-gray-400 mt-1">Manage platform access and roles.</p>
                      </div>
                      <button (click)="loadUsers()" class="px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-all flex items-center gap-2">
                         <span>↻</span> Refresh List
                      </button>
                  </div>
                  
                  <div class="overflow-x-auto">
                      <table class="w-full text-left border-collapse">
                         <thead class="bg-gray-50 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                            <tr>
                               <th class="px-6 py-4">User Identity</th>
                               <th class="px-6 py-4">Access Role</th>
                               <th class="px-6 py-4">Credits</th>
                               <th class="px-6 py-4">Change Role</th>
                               <th class="px-6 py-4 text-right">Actions</th>
                            </tr>
                         </thead>
                         <tbody class="divide-y divide-gray-50">
                            <tr *ngFor="let user of users" class="hover:bg-indigo-50/30 transition-colors group">
                               <td class="px-6 py-4">
                                  <div class="font-medium text-gray-800">{{ user.email }}</div>
                                  <div class="text-xs text-gray-400 mt-0.5">{{ user.id }}</div>
                               </td>
                               <td class="px-6 py-4">
                                  <span class="px-3 py-1 rounded-full text-xs font-bold tracking-wide" 
                                    [ngClass]="{
                                        'bg-red-50 text-red-600': user.role === 'SUPER_ADMIN',
                                        'bg-blue-50 text-blue-600': user.role === 'DEVELOPER',
                                        'bg-green-50 text-green-600': user.role === 'OPS_ADMIN',
                                        'bg-orange-50 text-orange-600': user.role === 'FINANCE_ADMIN',
                                        'bg-gray-100 text-gray-600': user.role === 'USER'
                                    }">
                                    {{ user.role.replace('_', ' ') }}
                                  </span>
                               </td>
                               <td class="px-6 py-4 font-medium text-gray-600">{{ user.credits }}</td>
                               <td class="px-6 py-4">
                                  <select (change)="updateRole(user, $any($event.target).value)" [value]="user.role" 
                                    class="text-sm border-gray-200 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 cursor-pointer bg-white py-1 pl-2 pr-8">
                                     <option value="USER">User</option>
                                     <option value="SUPER_ADMIN">Super Admin</option>
                                     <option value="FINANCE_ADMIN">Finance Admin</option>
                                     <option value="OPS_ADMIN">Ops Admin</option>
                                     <option value="DEVELOPER">Developer</option>
                                     <option value="SUPPORT">Support</option>
                                  </select>
                               </td>
                               <td class="px-6 py-4 text-right">
                                  <button (click)="deleteUser(user)" class="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50">
                                     <span class="sr-only">Delete</span>
                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                       <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                       <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                     </svg>
                                  </button>
                               </td>
                            </tr>
                         </tbody>
                      </table>
                  </div>
              </div>

          </div>
      </main>
    </div>
  `,
   styles: [`
    /* Using Utility Classes but keeping some custom animations */
    :host { display: block; height: 100vh; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    
    /* Scrollbar Polish */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #a0aec0; }
  `]
})
export class AdminDashboardComponent implements OnInit {
   view: 'DASH' | 'USERS' = 'DASH';
   users: any[] = [];
   loading = false;

   constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private router: Router) { }

   ngOnInit() { }

   goBack() {
      this.router.navigate(['/dashboard']);
   }

   async loadUsers() {
      this.view = 'USERS'; // Switch view automatically
      this.loading = true;
      try {
         const session = await fetchAuthSession();
         const token = session.tokens?.accessToken?.toString();
         const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

         this.http.get<any[]>('http://localhost:3000/users', { headers }).subscribe({
            next: (data) => {
               this.users = data;
               this.loading = false;
               this.cdr.detectChanges();
            },
            error: (err) => {
               console.error(err);
               this.loading = false;
            }
         });
      } catch (e) { this.loading = false; }
   }

   async updateRole(user: any, newRole: string) {
      if (!confirm(`Change role of ${user.email} to ${newRole}?`)) return;

      try {
         const session = await fetchAuthSession();
         const token = session.tokens?.accessToken?.toString();
         const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

         this.http.put(`http://localhost:3000/users/${user.id}/role`, { role: newRole }, { headers }).subscribe({
            next: () => {
               user.role = newRole; // Optimistic
               alert('Role updated!');
            },
            error: (err) => alert('Failed to update role. Ensure backend is running.')
         });
      } catch (e) { }
   }

   async deleteUser(user: any) {
      if (!confirm(`Are you sure you want to PERMANENTLY delete user ${user.email}? This action cannot be undone.`)) return;

      try {
         const session = await fetchAuthSession();
         const token = session.tokens?.accessToken?.toString();
         const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

         this.http.delete(`http://localhost:3000/users/${user.id}`, { headers }).subscribe({
            next: () => {
               this.users = this.users.filter(u => u.id !== user.id);
               alert('User deleted successfully.');
            },
            error: (err) => alert('Failed to delete user.')
         });
      } catch (e) { }
   }
}
