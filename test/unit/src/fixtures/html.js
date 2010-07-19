var largeTextEscaped = '&lt;span&gt;test&lt;/span&gt;', 
 largeTextUnescaped  = '<span>test</span>';

fuse.Number(2048).times(function(){ 
  largeTextEscaped += ' ABC';
  largeTextUnescaped += ' ABC';
});

largeTextEscaped = fuse.String(largeTextEscaped);
largeTextUnescaped = fuse.String(largeTextUnescaped);
