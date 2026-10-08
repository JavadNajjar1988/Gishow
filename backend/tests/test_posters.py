from io import BytesIO
from PIL import Image
from sqlalchemy import select
from backend.models import EventImage
from backend.tests.test_catalog import site, admin, create_salon, create_event, event_body, EVENTS

def picture():
    output=BytesIO()
    Image.new('RGB',(64,48),'green').save(output,format='PNG')
    return output.getvalue()

def test_poster_persistence_visibility_replace_and_delete(site):
    client,factory,_=admin(site)
    salon=create_salon(client);event=create_event(client,salon['id'])
    path=f"{EVENTS}/{event['id']}/images"
    response=client.post(path,files={'file':('poster.png',picture(),'image/png')})
    assert response.status_code==201,response.text
    image=response.json()
    assert client.get(image['url']).status_code==404
    private=client.get(image['preview_url'])
    assert private.status_code==200 and private.headers['content-type']=='image/webp'
    assert private.headers['cache-control']=='no-store'
    with factory() as db:
        stored=db.scalar(select(EventImage))
        assert stored.content==private.content and stored.width==64
        decoded=Image.open(BytesIO(stored.content))
        assert decoded.format=='WEBP' and not decoded.getexif()
    assert client.post(path,files={'file':('bad.svg',b'<svg/>','image/png')}).status_code==415
    assert client.get(image['preview_url']).content==private.content
    assert client.post(path,files={'file':('poster.png',picture(),'image/png')}).json()['id']==image['id']
    assert client.patch(f"{EVENTS}/{event['id']}",json=event_body(salon['id'],True)).status_code==200
    client.cookies.clear()
    assert client.get(image['url']).status_code==200
    assert client.get(image['preview_url']).status_code==401

def test_poster_limits_and_owner(site):
    client,factory,_=admin(site)
    salon=create_salon(client);first=create_event(client,salon['id']);second=create_event(client,salon['id'])
    path=f"{EVENTS}/{first['id']}/images"
    assert client.post(path,files={'file':('large.png',b'x'*(5*1024*1024+1),'image/png')}).status_code==413
    result=client.post(path,files={'file':('poster.png',picture(),'image/png')}).json()
    assert client.delete(f"{EVENTS}/{second['id']}/images/{result['id']}").status_code==404
    assert client.delete(f"{path}/{result['id']}").status_code==204
    assert client.get(result['preview_url']).status_code==404
