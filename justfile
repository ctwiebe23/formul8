build: doc compile

doc:
	pandoc -d pandoc.yml

compile:
	tsc
