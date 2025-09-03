import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  StarOff, 
  Edit, 
  Trash2, 
  Plus, 
  X,
  Save,
  Calendar,
  FileText
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  thesisService, 
  Thesis, 
  ThesisCreateData, 
  ThesisUpdateData 
} from '@/services/thesisService';

export default function Theses() {
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingThesis, setEditingThesis] = useState<Thesis | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  // Load theses on component mount
  useEffect(() => {
    loadTheses();
  }, []);

  const loadTheses = async () => {
    try {
      setLoading(true);
      const data = await thesisService.getTheses();
      setTheses(data);
    } catch (error) {
      console.error('Error loading theses:', error);
      toast({
        title: "Error",
        description: "Failed to load theses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThesis = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and content",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await thesisService.createThesis(formData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Thesis created successfully",
        });
        setFormData({ title: '', content: '' });
        setShowForm(false);
        loadTheses();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create thesis",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create thesis",
        variant: "destructive",
      });
    }
  };

  const handleUpdateThesis = async () => {
    if (!editingThesis || !formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and content",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await thesisService.updateThesis(editingThesis.id, formData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Thesis updated successfully",
        });
        setFormData({ title: '', content: '' });
        setEditingThesis(null);
        loadTheses();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update thesis",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update thesis",
        variant: "destructive",
      });
    }
  };

  const handleDeleteThesis = async (thesis: Thesis) => {
    if (!confirm(`Are you sure you want to delete "${thesis.title}"?`)) {
      return;
    }

    try {
      const result = await thesisService.deleteThesis(thesis.id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Thesis deleted successfully",
        });
        loadTheses();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete thesis",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete thesis",
        variant: "destructive",
      });
    }
  };

  const handleStarThesis = async (thesis: Thesis) => {
    try {
      const result = await thesisService.starThesis(thesis.id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: thesis.starred ? "Thesis unstarred" : "Thesis starred successfully",
        });
        loadTheses();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to star thesis",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to star thesis",
        variant: "destructive",
      });
    }
  };

  const startEdit = (thesis: Thesis) => {
    setEditingThesis(thesis);
    setFormData({ title: thesis.title, content: thesis.content });
  };

  const cancelEdit = () => {
    setEditingThesis(null);
    setFormData({ title: '', content: '' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading theses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Investment Theses</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your investment theses to align patent searches
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Thesis
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(showForm || editingThesis) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingThesis ? 'Edit Thesis' : 'Add New Thesis'}
              <Button
                variant="ghost"
                size="sm"
                onClick={editingThesis ? cancelEdit : () => setShowForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Enter thesis title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  placeholder="Paste your investment thesis here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={editingThesis ? handleUpdateThesis : handleCreateThesis}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingThesis ? 'Update Thesis' : 'Create Thesis'}
                </Button>
                {editingThesis && (
                  <Button variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Theses List */}
      {theses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No theses yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first investment thesis to start aligning patent searches
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Thesis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {theses.map((thesis) => (
            <Card 
              key={thesis.id} 
              className={`transition-all duration-200 ${
                thesis.starred ? 'ring-2 ring-primary/20 bg-primary/5' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{thesis.title}</CardTitle>
                      {thesis.starred && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          <Star className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(thesis.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {thesis.content.split(' ').length} words
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStarThesis(thesis)}
                      className={thesis.starred ? 'text-primary' : ''}
                    >
                      {thesis.starred ? (
                        <Star className="h-4 w-4" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(thesis)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteThesis(thesis)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground line-clamp-3">
                    {thesis.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
