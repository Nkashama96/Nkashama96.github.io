// Minimal JS for drag-drop, preview, and generating a sample metadata JSON
(() => {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const chooseBtn = document.getElementById('chooseBtn');
  const preview = document.getElementById('preview');
  const clearBtn = document.getElementById('clearBtn');
  const mintPreviewBtn = document.getElementById('mintPreviewBtn');
  const metadataOutput = document.getElementById('metadataOutput');
  const assetName = document.getElementById('assetName');
  const assetDesc = document.getElementById('assetDesc');

  let files = [];

  function prevent(e){ e.preventDefault(); e.stopPropagation(); }

  ['dragenter','dragover','dragleave','drop'].forEach(evt => {
    dropzone.addEventListener(evt, prevent, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    handleFiles(Array.from(dt.files));
  });

  dropzone.addEventListener('click', () => fileInput.click());
  chooseBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    handleFiles(Array.from(e.target.files));
    fileInput.value = null; // reset
  });

  clearBtn.addEventListener('click', () => {
    files = [];
    renderPreview();
    metadataOutput.hidden = true;
  });

  function handleFiles(list){
    // accept only images
    const imgs = list.filter(f => f.type && f.type.startsWith('image/'));
    files = files.concat(imgs);
    renderPreview();
  }

  function renderPreview(){
    preview.innerHTML = '';
    files.forEach((f, idx) => {
      const card = document.createElement('div'); card.className = 'thumb';
      const img = document.createElement('img');
      const info = document.createElement('div'); info.className='info';
      const name = document.createElement('span'); name.textContent = f.name;
      const size = document.createElement('span'); size.textContent = `${Math.round(f.size/1024)}KB`;
      info.appendChild(name); info.appendChild(size);

      const reader = new FileReader();
      reader.onload = (ev) => img.src = ev.target.result;
      reader.readAsDataURL(f);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn';
      removeBtn.textContent = 'Remove';
      removeBtn.onclick = () => {
        files.splice(idx,1);
        renderPreview();
      };

      card.appendChild(img);
      card.appendChild(info);
      card.appendChild(removeBtn);
      preview.appendChild(card);
    });

    if(files.length === 0){
      preview.innerHTML = '<div style="color:var(--muted); padding:12px">No images selected</div>';
    }
  }

  // Simple deterministic ID generator (SHA-1-like fallback using crypto.subtle if available)
  async function hashFile(file){
    if(window.crypto && crypto.subtle && crypto.subtle.digest){
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2,'0')).join('').slice(0,16);
    } else {
      // fallback: name+size+lastModified hashed simple
      return btoa(`${file.name}:${file.size}:${file.lastModified}`).slice(0,16);
    }
  }

  mintPreviewBtn.addEventListener('click', async () => {
    if(files.length === 0){
      alert('Please upload at least one image.');
      return;
    }
    // Build metadata array
    const items = [];
    for (let f of files){
      const id = await hashFile(f);
      items.push({
        token_id: id,
        name: assetName.value || f.name,
        description: assetDesc.value || '',
        filename: f.name,
        size: f.size,
        mime: f.type,
        // image_data: omitted (we don't send binary here)
      });
    }

    const metadata = {
      created_at: new Date().toISOString(),
      count: items.length,
      items
    };

    metadataOutput.textContent = JSON.stringify(metadata, null, 2);
    metadataOutput.hidden = false;

    // For future: you could POST metadata + files to backend endpoint here.
    // e.g. fetch('/api/upload', {method:'POST', body: formData})
  });

  // initial render
  renderPreview();
})();

