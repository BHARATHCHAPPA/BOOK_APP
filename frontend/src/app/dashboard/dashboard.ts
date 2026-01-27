import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { fetchAuthSession, signOut } from 'aws-amplify/auth';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  userEmail: string = '';
  backendStatus: string = 'Checking backend...';
  apiData: any = null;

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    try {
      const session = await fetchAuthSession();
      if (!session.tokens) {
        this.router.navigate(['/login']);
        return;
      }
      this.userEmail = session.tokens.idToken?.payload['email'] as string || 'User';

      // Auto-check backend connectivity
      this.testBackend();

    } catch (err) {
      console.error('Session error', err);
      this.router.navigate(['/login']);
    }
  }

  async testBackend() {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString(); // Use accessToken, not idToken

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      this.http.get('http://localhost:3000/users/me', { headers }).subscribe({
        next: (data) => {
          this.backendStatus = 'Online & Authenticated ✅';
          this.apiData = data;
          this.cdr.detectChanges(); // Force UI update
          console.log('Backend connected:', data);
        },
        error: (err) => {
          this.backendStatus = 'Error connecting ❌ ' + err.message;
          this.cdr.detectChanges(); // Force UI update
          console.error(err);
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  async onLogout() {
    await signOut();
    this.router.navigate(['/login']);
  }
}
