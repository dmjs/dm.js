# yui3-seed

[YUI 3](https://github.com/yui/yui3) seed files to use it with [bower](http://bower.io/).

## Installation instruction:

`bower install yui3-seed`

[Read more on how to use YUI3 seed files](http://yuilibrary.com/yui/docs/yui/#getting-started)

## Example:

```html
<script src="[bower_components_directory]/yui3-seed/yui-min.js"></script>
<script>
  YUI({
    modules   : {
      'your-optional-custom-module' : {
        fullpath : 'path/to/module.js'
      }
    }
  }).use('your-optional-custom-module', function(Y){
        // Your code goes here
      });
</script>
```
