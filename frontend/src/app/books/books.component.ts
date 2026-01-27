import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Router } from '@angular/router';

interface Book {
    id: string;
    title: string;
    author: string;
    description: string;
    coverImage: string;
    ageRange: string;
    price: number;
}

@Component({
    selector: 'app-books',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="library-container">
      <header class="library-header">
        <div>
          <h1>Book Library</h1>
          <p class="subtitle">Explore magical worlds curated for young minds</p>
        </div>
        <div class="header-actions">
           <!-- Placeholder for filter/search -->
           <span class="badge-pill">{{ books.length }} Books Available</span>
        </div>
      </header>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Fetching your library...</p>
      </div>

      <div *ngIf="!loading && books.length === 0" class="empty-state">
        <p>No books found. Check back soon!</p>
      </div>

      <div class="book-grid" *ngIf="!loading && books.length > 0">
        <div class="book-card" *ngFor="let book of books">
          <div class="card-image-wrapper">
             <img [src]="book.coverImage" [alt]="book.title" class="book-cover">
             <div class="age-badge">{{ book.ageRange }} yrs</div>
          </div>
          
          <div class="card-content">
            <h3 class="book-title">{{ book.title }}</h3>
            <p class="book-author">by {{ book.author }}</p>
            <p class="book-desc">{{ book.description | slice:0:80 }}...</p>
            
            <div class="card-footer">
              <span class="price-tag">
                <span class="currency-symbol">ⓒ</span> {{ book.price }}
              </span>
              <button class="btn-read">Read Now</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      background-color: #f8f9fc;
      min-height: 100vh;
    }

    .library-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    /* Header */
    .library-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 3rem;
      border-bottom: 2px solid #eef2f6;
      padding-bottom: 1.5rem;
    }

    h1 {
      font-size: 2.5rem;
      color: #1a1f36;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .subtitle {
      color: #697386;
      font-size: 1.1rem;
      margin: 0;
    }

    .badge-pill {
      background: #e3e8ee;
      color: #4f566b;
      padding: 0.5rem 1rem;
      border-radius: 99px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    /* Content */
    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem;
      color: #8792a2;
      font-size: 1.2rem;
    }

    /* Grid */
    .book-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 2.5rem;
    }

    /* Card */
    .book-card {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 20px rgba(0,0,0,0.04);
      transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .book-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 15px 30px rgba(0,0,0,0.1);
    }

    .card-image-wrapper {
      position: relative;
      height: 200px; /* Reduced height for cover */
      overflow: hidden;
      background: #f0f4f8;
    }

    .book-cover {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .book-card:hover .book-cover {
      transform: scale(1.05);
    }

    .age-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(255,255,255,0.95);
      padding: 0.25rem 0.75rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #3c4257;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .card-content {
      padding: 1.5rem;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }

    .book-title {
      font-size: 1.25rem;
      color: #1a1f36;
      margin: 0 0 0.25rem 0;
      line-height: 1.4;
      font-weight: 600;
    }

    .book-author {
      color: #697386;
      font-size: 0.9rem;
      margin: 0 0 1rem 0;
    }

    .book-desc {
      color: #4f566b;
      font-size: 0.95rem;
      line-height: 1.5;
      margin: 0 0 1.5rem 0;
      flex-grow: 1; /* Push footer down */
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      border-top: 1px solid #e3e8ee;
      padding-top: 1rem;
    }

    .price-tag {
      font-weight: 700;
      color: #3c4257;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .currency-symbol {
      color: #f5a623; /* Gold coin color */
    }

    .btn-read {
      background: #5469d4;
      color: white;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-read:hover {
      background: #4455bb;
    }
  `]
})
export class BooksComponent implements OnInit {
    books: Book[] = [];
    loading = true;

    constructor(
        private http: HttpClient,
        private cdr: ChangeDetectorRef,
        private router: Router
    ) { }

    async ngOnInit() {
        try {
            const session = await fetchAuthSession();
            if (!session.tokens) {
                this.router.navigate(['/login']);
                return;
            }

            const token = session.tokens.accessToken?.toString();
            const headers = new HttpHeaders({
                'Authorization': `Bearer ${token}`
            });

            this.http.get<Book[]>('http://localhost:3000/books', { headers }).subscribe({
                next: (data) => {
                    this.books = data;
                    this.loading = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Failed to load books', err);
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            });
        } catch (error) {
            console.error('Auth error', error);
            this.loading = false;
        }
    }
}
