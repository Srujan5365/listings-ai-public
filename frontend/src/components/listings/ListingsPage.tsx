import React, { useState, useMemo } from 'react';
import { ListingsStats } from './ListingsStats';
import { ListingsToolbar } from './ListingsToolbar';
import { ListingsTable } from './ListingsTable';
import { ListingDetailView } from './ListingDetailView';
import { AddListingModal } from './AddListingModal';
import { allListings as initialListings } from '../../data/mockData';
import type { ListingItem } from '../../types/index';


export const ListingsPage: React.FC<{ initialSearch?: string }> = ({ initialSearch = '' }) => {
  const [listings, setListings] = useState<ListingItem[]>(initialListings);
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  React.useEffect(() => { setSearchTerm(initialSearch); }, [initialSearch]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const triggerPublishToast = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const handleAddNewListing = (newListing: ListingItem) => {
    setListings((prev) => [newListing, ...prev]);
    triggerPublishToast();
  };

  const handleApproveListing = () => {
    if (selectedListing) {
      setListings((prev) =>
        prev.map((item) =>
          item.id === selectedListing.id ? { ...item, status: 'Published' } : item
        )
      );
      setSelectedListing((prev) => prev ? { ...prev, status: 'Published' } : null);
      triggerPublishToast();
    }
  };

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch =
        item.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.mls.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' ? true : item.status === statusFilter;

      const matchesPriority =
        priorityFilter === 'All' ? true : item.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [listings, searchTerm, statusFilter, priorityFilter]);

  // If a listing is clicked, render the detailed page view!
  if (selectedListing) {
    return (
      <ListingDetailView
        listing={selectedListing}
        onBack={() => setSelectedListing(null)}
        onApprove={handleApproveListing}
      />
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      <ListingsStats
        showToast={showToast}
        onCloseToast={() => setShowToast(false)}
      />

      <ListingsToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        onClearFilters={() => {
          setSearchTerm('');
          setStatusFilter('All');
          setPriorityFilter('All');
        }}
        onAddListing={() => setIsAddModalOpen(true)}
      />

      <ListingsTable
        listings={filteredListings}
        onSelectListing={(listing) => setSelectedListing(listing)}
      />

      <AddListingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddListing={handleAddNewListing}
      />
    </div>
  );
};