-- Verificar e corrigir a política RLS para INSERT na tabela companies
-- Primeiro, remover a política atual que pode estar causando problemas
DROP POLICY IF EXISTS "Only authenticated users can insert companies" ON companies;

-- Criar uma nova política mais permissiva para INSERT
-- que permite que qualquer usuário autenticado crie uma empresa
CREATE POLICY "Authenticated users can insert companies" 
ON companies 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);