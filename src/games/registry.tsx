import { lazy, type JSX, type LazyExoticComponent } from 'react';
import type { GameId } from '@/db/types';

// Each game is its own lazy chunk — with 13 games, loading only the one the
// patient tapped matters a lot more for a 2GB-RAM tablet than it would for a
// handful of routes.
export const GAME_COMPONENTS: Record<GameId, LazyExoticComponent<() => JSX.Element | null>> = {
  'smriti-cards': lazy(() => import('./smriti-cards/SmritiCardsGame')),
  'smriti-katha': lazy(() => import('./smriti-katha/SmritiKathaGame')),
  'naam-yaad': lazy(() => import('./naam-yaad/NaamYaadGame')),
  'dhyan-dhaam': lazy(() => import('./dhyan-dhaam/DhyanDhaamGame')),
  'ginti-dhyan': lazy(() => import('./ginti-dhyan/GintiDhyanGame')),
  'awaaz-pehchan': lazy(() => import('./awaaz-pehchan/AwaazPehchanGame')),
  'dinacharya-sequence': lazy(() => import('./dinacharya-sequence/DinacharyaSequenceGame')),
  'bazaar-list': lazy(() => import('./bazaar-list/BazaarListGame')),
  'ghar-ka-kaam': lazy(() => import('./ghar-ka-kaam/GharKaKaamGame')),
  'aakar-milan': lazy(() => import('./aakar-milan/AakarMilanGame')),
  'chaya-khoj': lazy(() => import('./chaya-khoj/ChayaKhojGame')),
  'naksha-jodo': lazy(() => import('./naksha-jodo/NakshaJodoGame')),
  'aaj-ka-din': lazy(() => import('./aaj-ka-din/AajKaDinGame')),
};
