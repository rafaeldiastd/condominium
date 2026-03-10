import { createClient } from '@supabase/supabase-js'

// Inicialize com as chaves de SERVICE_ROLE (encontradas em Project Settings -> API)
// NECESSITA DE ACESSO DE ADMINISTRADOR (NÃO a chave public / anon)
const supabaseUrl = 'YOUR_SUPABASE_URL_AQUI'
const supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY_AQUI'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const bucketsParaLimpar = ['avatars', 'announcement-images', 'campaign-images']

async function limparStorage() {
    for (const bucket of bucketsParaLimpar) {
        console.log(`Buscando arquivos no bucket: ${bucket}...`)

        // Lista os arquivos com paginação de até 100 itens (aumentar se necessário usando recursão de busca em pastas)
        const { data: arquivos, error: searchError } = await supabase.storage
            .from(bucket)
            .list('', {
                limit: 1000,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' },
            })

        if (searchError) {
            console.error(`Erro ao listar no bucket ${bucket}:`, searchError)
            continue
        }

        if (!arquivos || arquivos.length === 0) {
            console.log(`Bucket ${bucket} já está vazio.`)
            continue
        }

        // Ignora o item .emptyFolderPlaceholder caso exista
        const arquivosParaDeletar = arquivos.filter(arq => arq.name !== '.emptyFolderPlaceholder').map(arq => arq.name)

        if (arquivosParaDeletar.length > 0) {
            const { data, error } = await supabase.storage
                .from(bucket)
                .remove(arquivosParaDeletar)

            if (error) {
                console.error(`❌ Erro ao deletar no ${bucket}:`, error)
            } else {
                console.log(`✅ ${data?.length || 0} arquivos deletados do ${bucket}!`)
            }
        }
    }

    console.log('✅ Finalizado!')
}

limparStorage()
