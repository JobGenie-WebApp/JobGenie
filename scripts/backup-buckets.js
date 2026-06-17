const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function listAllFiles(bucket, prefix = '') {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    offset: 0,
  })
  if (error) throw error

  let files = []
  for (const item of data) {
    if (item.id === null) {
      // folder node — recurse into it
      const nested = await listAllFiles(bucket, prefix ? `${prefix}/${item.name}` : item.name)
      files = files.concat(nested)
    } else {
      files.push(prefix ? `${prefix}/${item.name}` : item.name)
    }
  }
  return files
}

async function backupAllBuckets() {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw error

  for (const bucket of buckets) {
    console.log(`Backing up bucket: ${bucket.name}`)
    const files = await listAllFiles(bucket.name)

    for (const filePath of files) {
      const { data, error: dlError } = await supabase.storage.from(bucket.name).download(filePath)
      if (dlError) {
        console.error(`  Failed to download ${filePath}: ${dlError.message}`)
        continue
      }
      const localPath = path.join('bucket_backup', bucket.name, filePath)
      fs.mkdirSync(path.dirname(localPath), { recursive: true })
      fs.writeFileSync(localPath, Buffer.from(await data.arrayBuffer()))
      console.log(`  Saved: ${localPath}`)
    }
  }
  console.log('Bucket backup complete.')
}

backupAllBuckets().catch(err => {
  console.error(err)
  process.exit(1)
})
