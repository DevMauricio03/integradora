import { Component, inject, signal } from '@angular/core';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BoostStoreService } from '../../../../../core/services/boost-store.service';
import { form, required, email, submit, FormField, SchemaPathTree, pattern, maxLength } from '@angular/forms/signals';

interface PaymentFormModel {
  email: string;
  cardName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [IconComponent, CommonModule, FormField],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class PaymentComponent {
  private readonly router = inject(Router);
  public readonly boostStore = inject(BoostStoreService);

  paymentModel = signal<PaymentFormModel>({
    email: '',
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  paymentForm = form(this.paymentModel, (schema: SchemaPathTree<PaymentFormModel>) => {
    required(schema.email, { message: 'El correo es obligatorio' });
    email(schema.email, { message: 'Correo inválido' });

    required(schema.cardName, { message: 'El nombre es obligatorio' });
    pattern(schema.cardName, /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'Solo letras y espacios' });

    required(schema.cardNumber, { message: 'El número es obligatorio' });
    pattern(schema.cardNumber, /^\d{16}$/, { message: 'Debe tener 16 dígitos' });
    maxLength(schema.cardNumber, 16, { message: 'Máximo 16 dígitos' });

    required(schema.expiryDate, { message: 'La fecha es obligatoria' });
    pattern(schema.expiryDate, /^(0[1-9]|1[0-2])\/(\d{2})$/, { message: 'Formato MM/YY (mes 01–12)' });

    required(schema.cvv, { message: 'El CVV es obligatorio' });
    pattern(schema.cvv, /^\d{3}$/, { message: 'Debe tener 3 dígitos' });
    maxLength(schema.cvv, 3, { message: 'Máximo 3 dígitos' });
  });

  loading = signal(false);

  // --- Shared sanitizer for numeric-only fields ---
  private sanitizeNumbers(value: string, maxLength: number): string {
    return value.replace(/\D/g, '').slice(0, maxLength);
  }

  private sanitizeCardName(raw: string): string {
    return raw.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  }

  // --- Input Handlers (Signal is the only source of truth) ---

  onCardNumberInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const clean = this.sanitizeNumbers(input.value, 16);
    this.paymentModel.update((m: PaymentFormModel) => ({ ...m, cardNumber: clean }));
    input.value = clean; // force DOM to reflect sanitized value immediately
  }

  onExpiryDateInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '').slice(0, 4);

    // If first digit > 1, auto-prefix with 0 (e.g. "2" → "02")
    if (digits.length >= 1 && Number.parseInt(digits[0], 10) > 1) {
      digits = '0' + digits.slice(0, 3);
    }

    const formatted = digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits;
    this.paymentModel.update((m: PaymentFormModel) => ({ ...m, expiryDate: formatted }));
    input.value = formatted;
  }

  onCvvInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const clean = this.sanitizeNumbers(input.value, 3);
    this.paymentModel.update((m: PaymentFormModel) => ({ ...m, cvv: clean }));
    input.value = clean; // force DOM to reflect sanitized value immediately
  }

  onCardNameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const sanitized = this.sanitizeCardName(input.value);
    this.paymentModel.update((m: PaymentFormModel) => ({ ...m, cardName: sanitized }));
    input.value = sanitized; // force DOM to reflect sanitized value immediately
  }

  confirmPayment(event: Event) {
    event.preventDefault();

    if (this.paymentForm().pending() || this.loading()) return;

    submit(this.paymentForm, async () => {
      this.loading.set(true);
      try {
        // Simulate payment processing (replace with Stripe integration)
        await new Promise(resolve => setTimeout(resolve, 800));

        this.boostStore.setStep('success');
        this.router.navigate(['/user/feed/boost/success']);
      } finally {
        this.loading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/user/feed/boost/plan-selection']);
  }
}
