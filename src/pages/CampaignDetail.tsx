import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Breadcrumbs, { useBreadcrumbs } from '../components/navigation/Breadcrumbs';
import { useCampaign } from '../hooks/useMarketing';

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const breadcrumbs = useBreadcrumbs();

  const { data: campaign, isLoading, isError } = useCampaign(id || '');

  if (isLoading) {
    return (
      <div className="p-6 text-white">
        Loading campaign...
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbs} />
        <div className="p-6 text-red-500">Error loading campaign.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <button
            onClick={() => navigate('/marketing')}
            className="mb-2 flex items-center text-sm font-medium text-gray-400 hover:text-white"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to Marketing
          </button>
          <h1 className="font-playfair text-3xl font-bold tracking-tight text-white">
            {campaign.title}
          </h1>
        </div>
      </div>

      <div className="rounded-xl bg-zinc-900 p-6 space-y-4">
        {campaign.description && (
          <p className="text-gray-300">{campaign.description}</p>
        )}
        <div className="text-sm text-gray-400">
          <span>
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </span>
          {campaign.date && (
            <span className="ml-2">
              |
              <span className="ml-2">
                {new Date(campaign.date).toLocaleDateString()}
              </span>
            </span>
          )}
        </div>
        {campaign.content?.text && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Content</h2>
            <p className="text-gray-300 whitespace-pre-line">{campaign.content.text}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetail;
