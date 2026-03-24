import { Injectable, signal, computed } from '@angular/core';

export type BoostPlanType = 'daily' | 'weekly' | 'monthly';
export type BoostStep = 'plan' | 'payment' | 'success';

export interface BoostPost {
  id: string;
  title: string;
  content: string;
  badge: string;
  type: string;
  category: string;
  image: string;
  images: string[];
  author: string;
  role: string;
  time: string;
  avatar: string;
  expirationDate: string;
  details: Record<string, any>;
}

export interface BoostPaymentPayload {
  postId: string;
  planId: BoostPlanType;
  amount: number;
  currency: 'MXN';
}

const PLAN_PRICES: Record<BoostPlanType, number> = {
  daily: 1.99,
  weekly: 9.99,
  monthly: 29.99
};

@Injectable({ providedIn: 'root' })
export class BoostStoreService {
  // --- State ---
  private readonly _selectedPost = signal<BoostPost | null>(null);
  private readonly _selectedPlan = signal<BoostPlanType | null>(null);
  private readonly _step = signal<BoostStep>('plan');
  
  // --- Public Readonly State ---
  public readonly selectedPost = this._selectedPost.asReadonly();
  public readonly selectedPlan = this._selectedPlan.asReadonly();
  public readonly step = this._step.asReadonly();

  // Guards
  public readonly isReadyForPayment = computed(() => !!this._selectedPost() && !!this._selectedPlan());
  
  // Computes the price safely, returns 0 if no plan is selected
  public readonly price = computed(() => {
    const plan = this._selectedPlan();
    return plan ? PLAN_PRICES[plan] : 0;
  });

  // --- Actions ---
  setPost(post: BoostPost) {
    this._selectedPost.set(post);
  }

  setPlan(plan: BoostPlanType) {
    this._selectedPlan.set(plan);
  }

  setStep(step: BoostStep) {
    this._step.set(step);
  }

  reset() {
    this._selectedPost.set(null);
    this._selectedPlan.set(null);
    this._step.set('plan');
  }

  // --- Stripe Preparation (No API yet) ---
  createPaymentIntent(): BoostPaymentPayload {
    const post = this._selectedPost();
    const plan = this._selectedPlan();
    
    // Fail-fast principle: Throw explicit errors instead of returning null
    if (!post?.id || !plan) {
      throw new Error('[BoostStore] Missing data: Cannot create payment intent without a selected post and plan.');
    }
    
    return {
      postId: post.id,
      planId: plan,
      amount: PLAN_PRICES[plan],
      currency: 'MXN'
    };
  }
}
