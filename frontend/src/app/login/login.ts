import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { signIn, signUp, confirmSignUp, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  email = '';
  password = '';
  otp = '';

  mode: 'LOGIN' | 'SIGNUP' | 'FORGOT' = 'LOGIN';
  step: 'CREDENTIALS' | 'OTP' = 'CREDENTIALS';

  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) { }

  toggleMode(targetMode: 'LOGIN' | 'SIGNUP' | 'FORGOT') {
    this.mode = targetMode;
    this.errorMessage = '';
    this.step = 'CREDENTIALS';
    this.cdr.detectChanges(); // Manually trigger change detection
  }

  async onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    if (!this.email) {
      this.errorMessage = 'Please enter your email.';
      this.isLoading = false;
      return;
    }

    if (this.mode !== 'FORGOT' && !this.password) {
      this.errorMessage = 'Please enter your password.';
      this.isLoading = false;
      return;
    }

    try {
      if (this.mode === 'LOGIN') {
        await this.handleLogin();
      } else if (this.mode === 'SIGNUP') {
        await this.handleSignUp();
      } else {
        await this.handleForgotPassword();
      }
    } catch (error: any) {
      console.error('Auth Error:', error);
      this.ngZone.run(() => {
        this.handleAuthError(error);
        this.isLoading = false;
      });
    }
  }

  async handleLogin() {
    const result = await signIn({
      username: this.email,
      password: this.password
    });

    this.ngZone.run(() => {
      if (result.isSignedIn) {
        this.router.navigate(['/dashboard']);
      } else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        this.step = 'OTP';
        this.mode = 'SIGNUP';
        this.errorMessage = 'Please verify your email to continue.';
        this.isLoading = false;

        import('aws-amplify/auth').then(auth =>
          auth.resendSignUpCode({ username: this.email })
        );
      }
    });
  }

  async handleSignUp() {
    console.log('Starting SignUp...');
    await signUp({
      username: this.email,
      password: this.password,
      options: { userAttributes: { email: this.email } }
    });
    console.log('SignUp Success - switching to OTP');

    // Direct assignment + manual change detection
    this.step = 'OTP';
    this.isLoading = false;
    this.cdr.detectChanges(); // Force Angular to update the view
    console.log('Change detection triggered, step is now:', this.step);
  }

  async handleForgotPassword() {
    await resetPassword({ username: this.email });
    this.ngZone.run(() => {
      this.step = 'OTP';
      this.isLoading = false;
    });
  }

  async onVerifyOtp() {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.mode === 'FORGOT' && !this.password) {
      this.errorMessage = 'Please set a new password.';
      this.isLoading = false;
      return;
    }

    try {
      if (this.mode === 'SIGNUP') {
        await confirmSignUp({
          username: this.email,
          confirmationCode: this.otp
        });
      } else if (this.mode === 'FORGOT') {
        await confirmResetPassword({
          username: this.email,
          confirmationCode: this.otp,
          newPassword: this.password
        });
      }

      const result = await signIn({
        username: this.email,
        password: this.password
      });

      this.ngZone.run(() => {
        if (result.isSignedIn) {
          this.router.navigate(['/dashboard']);
        }
      });
    } catch (error: any) {
      this.ngZone.run(() => {
        this.handleAuthError(error);
        this.isLoading = false;
      });
    }
  }

  async onResendCode() {
    try {
      const { resendSignUpCode } = await import('aws-amplify/auth');
      await resendSignUpCode({ username: this.email });
      alert('Code resent successfully!');
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }

  private handleAuthError(error: any) {
    if (error.name === 'UserNotConfirmedException' || (error.message && error.message.includes('not confirmed'))) {
      this.step = 'OTP';
      this.mode = 'SIGNUP';
      this.errorMessage = 'Account not verified. We sent a new code.';

      import('aws-amplify/auth').then(auth =>
        auth.resendSignUpCode({ username: this.email })
      );
    } else {
      this.errorMessage = error.message || 'An unexpected error occurred.';
    }
  }
}
