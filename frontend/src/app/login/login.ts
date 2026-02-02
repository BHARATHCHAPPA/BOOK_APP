import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { signIn, signUp, confirmSignUp, resetPassword, confirmResetPassword, confirmSignIn } from 'aws-amplify/auth';
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
  newPassword = ''; // For Force Change Password
  otp = '';

  mode: 'LOGIN' | 'SIGNUP' | 'FORGOT' = 'LOGIN';
  step: 'CREDENTIALS' | 'OTP' | 'NEW_PASSWORD' = 'CREDENTIALS';

  isLoading = false;
  errorMessage = '';

  // Modal State
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'SUCCESS' | 'ERROR' = 'SUCCESS';

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

  showAlert(title: string, message: string, type: 'SUCCESS' | 'ERROR') {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = type;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
  }

  validateInput(): boolean {
    // 1. Check Empty
    if (!this.email) {
      this.showAlert('Missing Email', 'Please enter your email address.', 'ERROR');
      return false;
    }

    // 2. Format Check (Simple Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.showAlert('Invalid Email', 'Please enter a valid email address (e.g., user@example.com).', 'ERROR');
      return false;
    }

    // 3. Password Check (if required by mode)
    if (this.mode !== 'FORGOT') {
      if (!this.password) {
        this.showAlert('Missing Password', 'Please enter your password.', 'ERROR');
        return false;
      }
      if (this.mode === 'SIGNUP') {
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\^$*.[\]{}()?"!@#%&/\\,><':;|_~`+=-]).{8,}$/;
        if (!strongPasswordRegex.test(this.password)) {
          this.showAlert(
            'Weak Password',
            'Password must meet all requirements:\n• At least 8 characters\n• 1 Uppercase Letter\n• 1 Lowercase Letter\n• 1 Number\n• 1 Special Character',
            'ERROR'
          );
          return false;
        }
      }
    }
    return true;
  }

  async onSubmit() {
    this.errorMessage = ''; // Clear old banner if any
    if (!this.validateInput()) return;

    this.isLoading = true;

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
      });
    } finally {
      this.isLoading = false; // Always stop loader
      this.cdr.detectChanges();
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
        this.showAlert('Verification Needed', 'Please verify your email to continue.', 'SUCCESS');

        import('aws-amplify/auth').then(auth =>
          auth.resendSignUpCode({ username: this.email })
        );
      } else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        this.step = 'NEW_PASSWORD';
        this.showAlert('Update Password', 'Please set a permanent password for your account.', 'SUCCESS');
      }
    });
  }

  async handleForceNewPassword() {
    if (!this.newPassword) {
      this.showAlert('Missing Password', 'Please enter your new password.', 'ERROR');
      return;
    }

    // Strong password check for new password
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\^$*.[\]{}()?"!@#%&/\\,><':;|_~`+=-]).{8,}$/;
    if (!strongPasswordRegex.test(this.newPassword)) {
      this.showAlert(
        'Weak Password',
        'Password must meet all requirements:\n• At least 8 characters\n• 1 Uppercase Letter\n• 1 Lowercase Letter\n• 1 Number\n• 1 Special Character',
        'ERROR'
      );
      return;
    }

    this.isLoading = true;
    try {
      const result = await confirmSignIn({
        challengeResponse: this.newPassword
      });

      this.ngZone.run(() => {
        if (result.isSignedIn) {
          this.router.navigate(['/dashboard']);
        }
      });
    } catch (error: any) {
      this.ngZone.run(() => {
        this.handleAuthError(error);
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async handleSignUp() {
    try {
      console.log('Starting SignUp...');
      await signUp({
        username: this.email,
        password: this.password,
        options: { userAttributes: { email: this.email } }
      });
      // Note: We cannot assign groups client-side during sign-up. 
      // The backend Post-Confirmation trigger or default role logic handles this.

      this.step = 'OTP';
      this.showAlert('Account Created', 'Please check your email for the verification code.', 'SUCCESS');
    } catch (error: any) {
      if (error.name === 'UsernameExistsException') {
        console.log('User exists, attempting to resend code...');
        try {
          const { resendSignUpCode } = await import('aws-amplify/auth');
          await resendSignUpCode({ username: this.email });
          this.step = 'OTP';
          this.showAlert('Account Exists', 'Account exists but was not verified. A new code has been sent.', 'SUCCESS');
          return;
        } catch (resendError: any) {
          console.error('Resend failed:', resendError);
        }
      }
      throw error;
    }
  }

  async handleForgotPassword() {
    await resetPassword({ username: this.email });
    this.ngZone.run(() => {
      this.step = 'OTP';
      this.showAlert('Code Sent', 'Check your email for the password reset code.', 'SUCCESS');
    });
  }

  async onVerifyOtp() {
    if (!this.otp) {
      this.showAlert('Missing Code', 'Please enter the verification code.', 'ERROR');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.mode === 'FORGOT' && !this.password) {
      this.showAlert('Missing Password', 'Please set a new password.', 'ERROR');
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
      });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async onResendCode() {
    try {
      this.isLoading = true;
      const { resendSignUpCode } = await import('aws-amplify/auth');
      await resendSignUpCode({ username: this.email });
      this.showAlert('Success', 'Code resent successfully!', 'SUCCESS');
    } catch (error: any) {
      this.handleAuthError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private handleAuthError(error: any) {
    if (error.name === 'UserNotConfirmedException' || (error.message && error.message.includes('not confirmed'))) {
      this.step = 'OTP';
      this.mode = 'SIGNUP';
      this.showAlert('Not Verified', 'Account not verified. We sent a new code.', 'ERROR');

      import('aws-amplify/auth').then(auth =>
        auth.resendSignUpCode({ username: this.email })
      );
    } else {
      const msg = error.message || 'An unexpected error occurred.';
      this.showAlert('Authentication Error', msg, 'ERROR');
    }
  }
}
