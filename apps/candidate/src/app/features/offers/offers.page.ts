import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CandidatePortalService } from '../../core/services/candidate-portal.service';

@Component({
  selector: 'app-offers-page',
  imports: [RouterLink],
  templateUrl: './offers.page.html',
  styleUrl: './offers.page.scss',
})
export class OffersPage implements OnInit {
  private readonly portalService = inject(CandidatePortalService);

  readonly offers = this.portalService.offers;
  readonly search = signal('');
  readonly activeFilter = signal<'all' | 'CDI' | 'CDD'>('all');

  readonly filteredOffers = computed(() => {
    const query = this.search().trim().toLowerCase();
    const filter = this.activeFilter();

    return this.offers().filter((offer) => {
      const matchQuery =
        query.length === 0 ||
        offer.title.toLowerCase().includes(query) ||
        offer.location.toLowerCase().includes(query) ||
        offer.description.toLowerCase().includes(query);

      const matchFilter = filter === 'all' || offer.contractType.toLowerCase().includes(filter.toLowerCase());

      return matchQuery && matchFilter;
    });
  });

  async ngOnInit(): Promise<void> {
    await this.portalService.loadOffers();
  }

  setFilter(filter: 'all' | 'CDI' | 'CDD'): void {
    this.activeFilter.set(filter);
  }
}
