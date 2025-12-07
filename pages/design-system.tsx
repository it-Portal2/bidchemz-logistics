import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import {
  Button,
  Input,
  Card,
  Badge,
  Table,
  Select,
  Textarea,
  Loading,
  Alert,
  Modal,
} from '../components/ui';
import type { Column } from '../components/ui';

const DesignSystemPage: NextPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sampleData = [
    { id: 1, name: 'Chemical Transport A', status: 'Active', price: 5000, rating: 4.5 },
    { id: 2, name: 'Chemical Transport B', status: 'Pending', price: 4500, rating: 4.2 },
    { id: 3, name: 'Chemical Transport C', status: 'Completed', price: 6000, rating: 4.8 },
  ];

  const columns: Column<typeof sampleData[0]>[] = [
    { key: 'id', header: 'ID', width: 'w-20' },
    { key: 'name', header: 'Name' },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const variants = {
          Active: 'success',
          Pending: 'warning',
          Completed: 'primary',
        } as const;
        return <Badge variant={variants[value as keyof typeof variants]}>{value}</Badge>;
      },
    },
    { key: 'price', header: 'Price', render: (value) => `₹${value.toLocaleString()}` },
    { key: 'rating', header: 'Rating', render: (value) => `${value} ⭐` },
  ];

  return (
    <div className="min-h-screen bg-secondary-50">
      <Head>
        <title>Design System - Bidchemz Logistics</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-secondary-900 mb-2">
            Bidchemz Design System
          </h1>
          <p className="text-lg text-secondary-600">
            Clean, industrial, data-centric B2B components
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold text-secondary-900 mb-6">Colors</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <h3 className="text-sm font-medium text-secondary-700 mb-2">Primary</h3>
                <div className="space-y-1">
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-primary-50 text-secondary-900">50</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-primary-100 text-secondary-900">100</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-primary-200 text-secondary-900">200</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-primary-300 text-secondary-900">300</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-primary-400 text-secondary-900">400</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-primary-500 text-white">500</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-primary-600 text-white">600</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-primary-700 text-white">700</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-primary-800 text-white">800</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-primary-900 text-white">900</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-secondary-700 mb-2">Secondary</h3>
                <div className="space-y-1">
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-secondary-50 text-secondary-900">50</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-secondary-100 text-secondary-900">100</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-secondary-200 text-secondary-900">200</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-secondary-300 text-secondary-900">300</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-secondary-400 text-white">400</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-secondary-500 text-white">500</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-secondary-600 text-white">600</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-secondary-700 text-white">700</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-secondary-800 text-white">800</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-secondary-900 text-white">900</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-secondary-700 mb-2">Success</h3>
                <div className="space-y-1">
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-success-50 text-secondary-900">50</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-success-100 text-secondary-900">100</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-success-200 text-secondary-900">200</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-success-300 text-secondary-900">300</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-success-400 text-secondary-900">400</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-success-500 text-white">500</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-success-600 text-white">600</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-success-700 text-white">700</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-success-800 text-white">800</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-success-900 text-white">900</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-secondary-700 mb-2">Warning</h3>
                <div className="space-y-1">
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-warning-50 text-secondary-900">50</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-warning-100 text-secondary-900">100</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-warning-200 text-secondary-900">200</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-warning-300 text-secondary-900">300</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-warning-400 text-secondary-900">400</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-warning-500 text-white">500</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-warning-600 text-white">600</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-warning-700 text-white">700</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-warning-800 text-white">800</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-warning-900 text-white">900</div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-secondary-700 mb-2">Danger</h3>
                <div className="space-y-1">
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-danger-50 text-secondary-900">50</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-danger-100 text-secondary-900">100</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-danger-200 text-secondary-900">200</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-danger-300 text-secondary-900">300</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-danger-400 text-secondary-900">400</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-danger-500 text-white">500</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-danger-600 text-white">600</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-danger-700 text-white">700</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-danger-800 text-white">800</div>
                  <div className="h-10 rounded flex items-center justify-center text-xs font-medium bg-danger-900 text-white">900</div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-secondary-900 mb-6">Buttons</h2>
            <Card>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary Button</Button>
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="danger">Danger Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="outline">Outline Button</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" size="sm">Small</Button>
                  <Button variant="primary" size="md">Medium</Button>
                  <Button variant="primary" size="lg">Large</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" isLoading>Loading</Button>
                  <Button variant="primary" disabled>Disabled</Button>
                </div>
              </div>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-secondary-900 mb-6">Form Inputs</h2>
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Email Address" type="email" placeholder="Enter your email" required />
                <Input label="Phone Number" type="tel" placeholder="+91 98765 43210" />
                <Input label="With Error" error="This field is required" />
                <Input label="With Hint" hint="Enter your full legal name" />
                <Select
                  label="Select Option"
                  options={[
                    { value: '', label: 'Choose...' },
                    { value: '1', label: 'Option 1' },
                    { value: '2', label: 'Option 2' },
                  ]}
                />
                <div className="md:col-span-2">
                  <Textarea label="Description" placeholder="Enter detailed description" />
                </div>
              </div>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-secondary-900 mb-6">Badges</h2>
            <Card>
              <div className="flex flex-wrap gap-3">
                <Badge variant="primary">Primary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="neutral">Neutral</Badge>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <Badge variant="success" dot>With Dot</Badge>
                <Badge variant="primary" size="sm">Small</Badge>
                <Badge variant="primary" size="md">Medium</Badge>
                <Badge variant="primary" size="lg">Large</Badge>
              </div>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-secondary-900 mb-6">Alerts</h2>
            <div className="space-y-4">
              <Alert type="info" title="Information">
                This is an informational message with helpful details.
              </Alert>
              <Alert type="success" title="Success">
                Your operation completed successfully!
              </Alert>
              <Alert type="warning" title="Warning">
                Please review this important warning message.
              </Alert>
              <Alert type="danger" title="Error">
                An error occurred while processing your request.
              </Alert>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-secondary-900 mb-6">Tables</h2>
            <Card padding="none">
              <Table data={sampleData} columns={columns} hoverable striped />
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-secondary-900 mb-6">Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Card Title" subtitle="Card subtitle goes here">
                <p className="text-secondary-600">
                  This is a basic card with title and subtitle.
                </p>
              </Card>
              <Card
                title="With Action"
                headerAction={<Button variant="ghost" size="sm">Action</Button>}
                hoverable
              >
                <p className="text-secondary-600">
                  This card has a header action button and is hoverable.
                </p>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-secondary-900 mb-6">Loading States</h2>
            <Card>
              <div className="flex items-center gap-8">
                <Loading size="sm" />
                <Loading size="md" />
                <Loading size="lg" text="Loading..." />
              </div>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-secondary-900 mb-6">Modal</h2>
            <Card>
              <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Modal Title"
                footer={
                  <>
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                      Confirm
                    </Button>
                  </>
                }
              >
                <p className="text-secondary-600">
                  This is a modal dialog with a title and footer actions.
                </p>
              </Modal>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DesignSystemPage;
