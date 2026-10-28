#!/usr/bin/env python3
"""Search open sound APIs and download a selected, credited audio asset."""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import time
from urllib.error import HTTPError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, build_opener, HTTPRedirectHandler
from common import probe, read_json, sha256, write_json

HOSTS={'commons.wikimedia.org','upload.wikimedia.org','freesound.org','cdn.freesound.org'}
MAX_BYTES=20*1024*1024


def safe_url(url):
    parsed=urlparse(url)
    if parsed.scheme!='https' or parsed.hostname not in HOSTS or parsed.username or parsed.password or parsed.port not in [None,443]:
        raise ValueError('Sound URLs must be HTTPS on the supported Commons/Freesound hosts.')
    return url


class Redirects(HTTPRedirectHandler):
    def redirect_request(self,request,fp,code,msg,headers,newurl):
        safe_url(newurl)
        result=super().redirect_request(request,fp,code,msg,headers,newurl)
        if result and urlparse(request.full_url).hostname!=urlparse(newurl).hostname:
            result.remove_header('Authorization')
        return result


def request(url, headers=None, limit=MAX_BYTES):
    safe_url(url)
    agent=os.environ.get('VIDEO_EDIT_USER_AGENT','VideoEditSkill/1.0 (local creative editing)')
    req=Request(url,headers={'User-Agent':agent,**(headers or {})})
    for attempt in range(2):
        try:
            with build_opener(Redirects()).open(req,timeout=25) as response:
                if int(response.headers.get('Content-Length',0))>limit:raise ValueError('Asset exceeds download size limit.')
                data=response.read(limit+1)
                if len(data)>limit:raise ValueError('Asset exceeds download size limit.')
                return data
        except HTTPError as exc:
            if exc.code in [429,503] and attempt==0:
                retry=exc.headers.get('Retry-After','2');time.sleep(min(10,int(retry) if retry.isdigit() else 2));continue
            raise ValueError(f'Public sound API returned HTTP {exc.code}. Use another provider or generated effects.') from exc


class Plain(HTMLParser):
    def __init__(self):super().__init__();self.parts=[]
    def handle_data(self,data):self.parts.append(data)


def plain(value):
    parser=Plain();parser.feed(str(value));return ' '.join(''.join(parser.parts).split())


def license_allowed(name,url='',sharealike=False):
    value=(name+' '+url).casefold()
    if any(x in value for x in ['noncommercial','non-commercial','by-nc','by-nd','no derivatives','sampling']):return False
    if 'by-sa' in value or 'by sa' in value or 'sharealike' in value:return sharealike
    return any(x in value for x in ['creativecommons.org/publicdomain/zero','creativecommons.org/publicdomain/mark','cc0','creative commons 0','public domain','creativecommons.org/licenses/by/','cc by ','attribution'])


def search(provider,query,limit=8):
    if not 1<=limit<=25:raise ValueError('Search limit must be 1–25.')
    if provider=='commons':
        params=dict(action='query',format='json',generator='search',gsrnamespace=6,gsrlimit=limit,
                    gsrsearch='filetype:audio '+query,prop='imageinfo',iiprop='url|size|mime|extmetadata')
        data=json.loads(request('https://commons.wikimedia.org/w/api.php?'+urlencode(params)))
        if data.get('error'):raise ValueError('Commons API: '+str(data['error'].get('info','query failed')))
        items=[]
        for page in data.get('query',{}).get('pages',{}).values():
            if not page.get('imageinfo'):continue
            info=page['imageinfo'][0];meta=info.get('extmetadata',{})
            def field(name):return plain(meta.get(name,{}).get('value',''))
            if not (info.get('mime','').startswith('audio/') or info.get('mime')=='application/ogg'):continue
            items.append(dict(id=str(page['pageid']),title=page['title'].removeprefix('File:'),author=field('Artist'),
                license=field('LicenseShortName') or field('UsageTerms'),license_url=field('LicenseUrl'),
                source_url=info.get('descriptionurl',''),download_url=info['url'],bytes=info.get('size'),provider='commons',quality='original'))
        return items
    token=os.environ.get('FREESOUND_API_KEY')
    if not token:raise ValueError('Freesound search needs FREESOUND_API_KEY. Commons and generated effects work without it.')
    # Current API v2 endpoint; original-file downloads require a separate OAuth flow.
    params=dict(query=query,page_size=limit,fields='id,name,username,license,url,previews,duration,type')
    data=json.loads(request('https://freesound.org/apiv2/search/?'+urlencode(params),{'Authorization':'Token '+token}))
    return [dict(id=str(x['id']),title=x['name'],author=x.get('username',''),license=x.get('license',''),
                 license_url=x.get('license','') if x.get('license','').startswith('http') else '',source_url=x.get('url',''),
                 download_url=x.get('previews',{}).get('preview-hq-mp3') or x.get('previews',{}).get('preview-lq-mp3'),
                 duration=x.get('duration'),provider='freesound',quality='preview') for x in data.get('results',[]) if x.get('previews')]


def fetch(catalog,asset_id,output,sharealike=False):
    rows=read_json(catalog)['results'];matches=[x for x in rows if x['id']==asset_id]
    if len(matches)!=1:raise ValueError('Select exactly one id from the search results.')
    asset=matches[0]
    if not license_allowed(asset.get('license',''),asset.get('license_url',''),sharealike):
        raise ValueError('License is unknown or outside the chosen reuse policy. Choose CC0/CC BY, or review share-alike terms explicitly.')
    if asset.get('bytes',0) and asset['bytes']>MAX_BYTES:raise ValueError('Choose an asset smaller than 20MB.')
    output=Path(output).resolve();output.mkdir(parents=True,exist_ok=True)
    ext=Path(urlparse(asset['download_url']).path).suffix.lower()
    if ext not in ['.mp3','.wav','.flac','.ogg','.oga','.m4a','.aiff','.aif']:ext='.audio'
    safe_id=re.sub('[^a-zA-Z0-9-]','-',asset_id)
    path=output/(asset['provider']+'-'+safe_id+ext)
    if path.exists():raise ValueError('Asset already exists; reuse it or choose another output folder.')
    data=request(asset['download_url']);path.write_bytes(data)
    try:
        meta=probe(path)
        if not meta['has_audio']:raise ValueError('Selected file has no decodable audio stream.')
    except Exception:
        path.unlink(missing_ok=True);raise
    asset=dict(asset,file=path.name,sha256=sha256(path),downloaded_at=datetime.now(timezone.utc).isoformat(),
               duration=meta['duration'],modifications='none')
    write_json(path.with_suffix('.credit.json'),asset)
    print(json.dumps(asset,ensure_ascii=False,indent=2))


def main():
    p=argparse.ArgumentParser(description=__doc__);sub=p.add_subparsers(dest='command',required=True)
    s=sub.add_parser('search');s.add_argument('query');s.add_argument('--provider',choices=['commons','freesound'],default='commons');s.add_argument('--limit',type=int,default=8);s.add_argument('--out',type=Path,required=True)
    f=sub.add_parser('fetch');f.add_argument('catalog',type=Path);f.add_argument('--id',required=True);f.add_argument('--out',type=Path,required=True);f.add_argument('--allow-sharealike',action='store_true')
    args=p.parse_args()
    if args.command=='search':
        rows=search(args.provider,args.query,args.limit)
        for row in rows:row['allowed_default']=license_allowed(row.get('license',''),row.get('license_url',''))
        write_json(args.out,dict(provider=args.provider,query=args.query,results=rows));print(f'Saved {len(rows)} candidates to {args.out}. Choose a candidate, fetch it, and audition it before placing.')
    else:fetch(args.catalog,args.id,args.out,args.allow_sharealike)


if __name__=='__main__':
    try:main()
    except (ValueError,OSError) as exc:
        import sys
        print('sound-assets: '+str(exc),file=sys.stderr);sys.exit(2)
