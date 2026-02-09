import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import api, { ConversationSummary } from '@/services/api';

export function useConversationHistory() {
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchConversations = async () => {
        setIsLoading(true);
        try {
            const data = await api.history.getConversations(50, 0);
            setConversations(data);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
            toast({
                title: 'Error',
                description: 'Failed to load conversation history',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    const deleteConversation = async (conversationId: string) => {
        try {
            await api.history.deleteConversation(conversationId);
            setConversations(prev => prev.filter(c => c.id !== conversationId));
            toast({
                title: 'Success',
                description: 'Conversation deleted',
            });
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete conversation',
                variant: 'destructive',
            });
        }
    };

    return {
        conversations,
        isLoading,
        fetchConversations,
        deleteConversation,
    };
}
