import React, {useState} from 'react';
import {fileUploadApi, serverId} from '../services/apiServices';
import {EventItem} from '../types';

export function PosterUpload({event,onChanged}: {event:EventItem|null;onChanged:()=>void}) {
  const [image,setImage]=useState(event?.images?.[0]);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  async function upload(file?:File) {
    if(!file || !event)return;
    setBusy(true);setMessage('');
    try {if(file.size>5*1024*1024)throw new Error('حداکثر حجم تصویر پنج مگابایت است.');
      const saved=await fileUploadApi.uploadPoster(file,serverId(event.id));setImage({...saved,alt:event.title});setMessage('پوستر در سرور ذخیره شد.');onChanged();
    }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
  }
  return <section className="space-y-3 border rounded-xl p-3"><h3>پوستر برنامه</h3>
    {!event ? <p>پس از ذخیره برنامه، بارگذاری پوستر فعال می‌شود.</p> : <>
      {image && <img src={image.preview_url} alt={image.alt || event.title} className="max-h-64 max-w-full rounded-xl"/>}
      <label className="block">{image?'جایگزینی پوستر':'انتخاب و بارگذاری پوستر'}<input className="block w-full" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/></label>
      <p className="text-sm">تصویر ثابت با حداکثر حجم پنج مگابایت؛ نسخه بهینه‌شده ذخیره می‌شود.</p>
      {image && <button type="button" disabled={busy} onClick={async()=>{setBusy(true);try{await fileUploadApi.removePoster(serverId(event.id),image.id);setImage(undefined);setMessage('پوستر حذف شد.');onChanged();}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}}>حذف پوستر</button>}
      <p role="status">{busy?'در حال ذخیره تصویر…':message}</p>
    </>}
  </section>;
}
