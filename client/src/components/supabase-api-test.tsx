import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import * as supabaseApi from '@/lib/supabase-api';
import { Filter } from '@/lib/supabase-api';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function SupabaseApiTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tableName, setTableName] = useState('products');
  const [columns, setColumns] = useState('*');
  
  // Insert data form
  const [insertData, setInsertData] = useState<string>('{"name": "Test Product", "description": "Created via secure API", "userId": 1}');
  
  // Update data form
  const [updateData, setUpdateData] = useState<string>('{
  "description": "Updated via secure API"
}');
  const [updateFilters, setUpdateFilters] = useState<string>('[{
  "column": "name",
  "operator": "eq",
  "value": "Test Product"
}]');
  
  // Delete filters form
  const [deleteFilters, setDeleteFilters] = useState<string>('[{
  "column": "name",
  "operator": "eq",
  "value": "Test Product"
}]');
  
  // Select filters form
  const [selectFilters, setSelectFilters] = useState<string>('[]');

  // Function to test the select API
  const testSelect = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Filter[] = JSON.parse(selectFilters);
      const data = await supabaseApi.select(tableName, {
        columns,
        filters,
      });
      setResults(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Select error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to test the insert API
  const testInsert = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = JSON.parse(insertData);
      const result = await supabaseApi.insert(tableName, data);
      setResults(result);
    } catch (err: any) {
      setError(err.message);
      console.error('Insert error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to test the update API
  const testUpdate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = JSON.parse(updateData);
      const filters: Filter[] = JSON.parse(updateFilters);
      const result = await supabaseApi.update(tableName, data, filters);
      setResults(result);
    } catch (err: any) {
      setError(err.message);
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to test the delete API
  const testDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Filter[] = JSON.parse(deleteFilters);
      const result = await supabaseApi.remove(tableName, filters);
      setResults(result);
    } catch (err: any) {
      setError(err.message);
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Supabase API Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Test Secure Supabase API</CardTitle>
              <CardDescription>
                Test the secure server-side Supabase API proxy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="select">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="select">Select</TabsTrigger>
                  <TabsTrigger value="insert">Insert</TabsTrigger>
                  <TabsTrigger value="update">Update</TabsTrigger>
                  <TabsTrigger value="delete">Delete</TabsTrigger>
                </TabsList>
                
                <TabsContent value="select" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="select-table">Table Name</Label>
                    <Input 
                      id="select-table"
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="select-columns">Columns</Label>
                    <Input 
                      id="select-columns"
                      value={columns}
                      onChange={(e) => setColumns(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="select-filters">Filters (JSON)</Label>
                    <Textarea 
                      id="select-filters"
                      rows={5}
                      value={selectFilters}
                      onChange={(e) => setSelectFilters(e.target.value)}
                    />
                  </div>
                  
                  <Button onClick={testSelect} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : 'Test Select'}
                  </Button>
                </TabsContent>
                
                <TabsContent value="insert" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="insert-table">Table Name</Label>
                    <Input 
                      id="insert-table"
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="insert-data">Data (JSON)</Label>
                    <Textarea 
                      id="insert-data"
                      rows={8}
                      value={insertData}
                      onChange={(e) => setInsertData(e.target.value)}
                    />
                  </div>
                  
                  <Button onClick={testInsert} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : 'Test Insert'}
                  </Button>
                </TabsContent>
                
                <TabsContent value="update" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="update-table">Table Name</Label>
                    <Input 
                      id="update-table"
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="update-data">Data (JSON)</Label>
                    <Textarea 
                      id="update-data"
                      rows={4}
                      value={updateData}
                      onChange={(e) => setUpdateData(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="update-filters">Filters (JSON)</Label>
                    <Textarea 
                      id="update-filters"
                      rows={6}
                      value={updateFilters}
                      onChange={(e) => setUpdateFilters(e.target.value)}
                    />
                  </div>
                  
                  <Button onClick={testUpdate} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : 'Test Update'}
                  </Button>
                </TabsContent>
                
                <TabsContent value="delete" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-table">Table Name</Label>
                    <Input 
                      id="delete-table"
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="delete-filters">Filters (JSON)</Label>
                    <Textarea 
                      id="delete-filters"
                      rows={6}
                      value={deleteFilters}
                      onChange={(e) => setDeleteFilters(e.target.value)}
                    />
                  </div>
                  
                  <Button onClick={testDelete} disabled={loading} variant="destructive">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : 'Test Delete'}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                API response data or error messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                  <h3 className="text-red-800 font-semibold mb-2">Error</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              ) : null}
              
              {results ? (
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                  <h3 className="text-slate-800 font-semibold mb-2">Data</h3>
                  <pre className="text-xs overflow-auto max-h-96">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </div>
              ) : null}
              
              {!results && !error && (
                <p className="text-slate-500 italic">No results to display yet. Run a test to see data.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
