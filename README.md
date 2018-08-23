# dirs-match

## Examples

### CLI

```
npx -p dirs-match@0.0.3 dirs-match __test__/fixtures/a __test__/fixtures/b  
```

### Docker

```
docker run -v$(pwd)/__test__:/__test__ nju33/dirs-match:0.0.3 /__test__/fixtures/a /__test__/fixtures/b   
```