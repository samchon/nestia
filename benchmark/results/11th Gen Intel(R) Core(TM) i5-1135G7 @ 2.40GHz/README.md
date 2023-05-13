# Benchmark of `nestia`
> - CPU: 11th Gen Intel(R) Core(TM) i5-1135G7 @ 2.40GHz
> - Memory: 16,218 MB
> - OS: win32
> - NodeJS version: v16.20.0
> - Nestia version: v0.1.0


## stringify
![stringify benchmark](images/stringify.svg)

 Types | nestia-express | nestia-fastify | NestJS-express | NestJS-fastify 
-------|------|------|------|------
 object (simple) | 55 | 122 | 8.03 | 8.77 
 object (hierarchical) | 132 | 157 | 16 | 16 
 object (recursive) | 131 | 168 | 14 | 15 
 object (union, explicit) | 100 | 122 | 6.63 | 6.92 
 array (simple) | 112 | 140 | 16 | 15 
 array (hierarchical) | 155 | 158 | 13 | 13 
 array (recursive) | 125 | 136 | 13 | 14 
 array (union, explicit) | 121 | 129 | 15 | 16 

> Unit: Megabytes/sec







Total elapsed time: 426,859 ms
